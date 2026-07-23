/**
 * Shopify OAuth Token Exchange.
 *
 * Shopify's managed installation (declarative access scopes) does NOT hit
 * the app's OAuth callback — the merchant lands directly on the embedded
 * app URL with a valid App Bridge session token. To obtain an offline
 * access token we exchange that session (id) token for one via:
 *
 *   POST https://{shop}/admin/oauth/access_token
 *     grant_type=urn:ietf:params:oauth:grant-type:token-exchange
 *     subject_token=<session_token>
 *     subject_token_type=urn:ietf:params:oauth:token-type:id_token
 *     requested_token_type=urn:shopify:params:oauth:token-type:offline-access-token
 *
 * https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/token-exchange
 */
import { encryptToken } from "@/lib/security/token-crypto.server";
import { ShopifyAdminClient } from "@/lib/services/shopify/admin-client.server";
import { logger } from "@/lib/logger";

const SHOP_QUERY = /* GraphQL */ `
  query Shop {
    shop {
      id
      name
      email
      myshopifyDomain
      currencyCode
      ianaTimezone
      billingAddress { countryCodeV2 }
      plan { displayName }
    }
  }
`;

interface ExchangedToken {
  accessToken: string;
  scope: string;
}

async function exchangeSessionToken(
  shopDomain: string,
  sessionToken: string,
  apiKey: string,
  apiSecret: string,
): Promise<ExchangedToken> {
  const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      subject_token: sessionToken,
      subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
      requested_token_type: "urn:shopify:params:oauth:token-type:offline-access-token",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Token exchange failed (${res.status}): ${body.slice(0, 200)}`,
    );
  }
  const json = (await res.json()) as { access_token?: string; scope?: string };
  if (!json.access_token) throw new Error("Token exchange returned no access_token");
  return { accessToken: json.access_token, scope: json.scope ?? "" };
}

interface ProvisionResult {
  shopId: string;
  shopDomain: string;
}

/**
 * Provision (or refresh) a shop row from a valid App Bridge session token.
 * Idempotent — safe to call every time the middleware sees a shop that
 * isn't in the database yet.
 */
export async function provisionShopFromSessionToken(params: {
  shopDomain: string;
  sessionToken: string;
  apiKey: string;
  apiSecret: string;
}): Promise<ProvisionResult> {
  const { shopDomain, sessionToken, apiKey, apiSecret } = params;

  const exchanged = await exchangeSessionToken(
    shopDomain,
    sessionToken,
    apiKey,
    apiSecret,
  );

  const admin = new ShopifyAdminClient({
    shopifyDomain: shopDomain,
    accessToken: exchanged.accessToken,
  });

  const shopData = (await admin.graphql(SHOP_QUERY)) as {
    shop: {
      id: string;
      name: string;
      email: string;
      currencyCode: string;
      ianaTimezone: string;
      billingAddress?: { countryCodeV2: string | null } | null;
      plan?: { displayName: string | null } | null;
    };
  };
  const s = shopData.shop;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nowIso = new Date().toISOString();
  const { data: upserted, error: upsertErr } = await supabaseAdmin
    .from("shops")
    .upsert(
      {
        shopify_domain: shopDomain,
        shopify_shop_id: s.id,
        name: s.name,
        email: s.email,
        currency: s.currencyCode,
        timezone: s.ianaTimezone,
        country_code: s.billingAddress?.countryCodeV2 ?? null,
        plan_name: s.plan?.displayName ?? null,
        access_token_encrypted: encryptToken(exchanged.accessToken),
        scopes: exchanged.scope,
        installed_at: nowIso,
        uninstalled_at: null,
        updated_at: nowIso,
      },
      { onConflict: "shopify_domain" },
    )
    .select("id, shopify_domain")
    .single();

  if (upsertErr || !upserted) {
    logger.error("shopify.token_exchange.upsert_failed", {
      message: upsertErr?.message,
    });
    throw new Error(`Shop provisioning failed: ${upsertErr?.message ?? "unknown"}`);
  }

  logger.info("shopify.token_exchange.shop_provisioned", {
    shopDomain,
    shopId: upserted.id,
  });

  return { shopId: upserted.id, shopDomain: upserted.shopify_domain };
}

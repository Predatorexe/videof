/**
 * Shopify Storefront GraphQL client (public data).
 * Uses the storefront access token; safe for client bundles if needed,
 * but kept server-side by convention.
 */
import { ExternalServiceError } from "@/lib/errors";
import { serverEnv } from "@/lib/env";

export interface StorefrontClientOptions {
  shopifyDomain: string;
  storefrontToken: string;
  apiVersion?: string;
}

export class ShopifyStorefrontClient {
  private readonly endpoint: string;
  constructor(private readonly opts: StorefrontClientOptions) {
    const version = opts.apiVersion ?? serverEnv().SHOPIFY_API_VERSION;
    this.endpoint = `https://${opts.shopifyDomain}/api/${version}/graphql.json`;
  }
  async graphql<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": this.opts.storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) {
      throw new ExternalServiceError("shopify.storefront", `HTTP ${res.status}`);
    }
    const body = (await res.json()) as { data?: T; errors?: unknown[] };
    if (body.errors?.length) {
      throw new ExternalServiceError("shopify.storefront", "GraphQL errors", body.errors);
    }
    if (!body.data) throw new ExternalServiceError("shopify.storefront", "Empty response");
    return body.data;
  }
}

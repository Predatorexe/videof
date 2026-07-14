/**
 * Shopify Admin GraphQL client.
 *
 * Wraps `fetch` against `https://{shop}/admin/api/{version}/graphql.json`.
 * Ready to use once a shop's access token is stored server-side.
 */
import { ExternalServiceError, UnauthorizedError } from "@/lib/errors";
import { serverEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export interface AdminClientOptions {
  shopifyDomain: string;      // "acme.myshopify.com"
  accessToken: string;         // shpat_...
  apiVersion?: string;
}

export interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
  extensions?: Record<string, unknown>;
}

export class ShopifyAdminClient {
  private readonly endpoint: string;
  constructor(private readonly opts: AdminClientOptions) {
    const version = opts.apiVersion ?? serverEnv().SHOPIFY_API_VERSION;
    this.endpoint = `https://${opts.shopifyDomain}/admin/api/${version}/graphql.json`;
  }

  async graphql<T = unknown>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.opts.accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 401 || res.status === 403) {
      throw new UnauthorizedError("Shopify token rejected");
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ExternalServiceError("shopify.admin", `HTTP ${res.status}: ${text}`);
    }
    const body = (await res.json()) as GraphqlResponse<T>;
    if (body.errors?.length) {
      logger.error("shopify.admin.graphql errors", { errors: body.errors });
      throw new ExternalServiceError("shopify.admin", body.errors[0].message, body.errors);
    }
    if (!body.data) throw new ExternalServiceError("shopify.admin", "Empty response");
    return body.data;
  }

  /** REST helper for the few endpoints without a GraphQL equivalent. */
  async rest(path: string, init?: RequestInit) {
    const version = this.opts.apiVersion ?? serverEnv().SHOPIFY_API_VERSION;
    const url = `https://${this.opts.shopifyDomain}/admin/api/${version}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.opts.accessToken,
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ExternalServiceError("shopify.admin.rest", `HTTP ${res.status}: ${text}`);
    }
    return res.json();
  }
}

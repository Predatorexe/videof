/** Shopify Collection service — Admin GraphQL wrapper. */
import type { ShopifyAdminClient } from "./admin-client.server";

const COLLECTIONS_QUERY = /* GraphQL */ `
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges { node { id handle title description image { url } productsCount { count } } }
    }
  }
`;

export class ShopifyCollectionService {
  constructor(private readonly client: ShopifyAdminClient) {}
  async list(first = 50, after?: string) {
    return this.client.graphql(COLLECTIONS_QUERY, { first, after });
  }
}

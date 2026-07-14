/** Shopify Customer service. */
import type { ShopifyAdminClient } from "./admin-client.server";

const CUSTOMERS_QUERY = /* GraphQL */ `
  query Customers($first: Int!, $after: String) {
    customers(first: $first, after: $after, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      edges { node { id email firstName lastName numberOfOrders amountSpent { amount currencyCode } tags } }
    }
  }
`;

export class ShopifyCustomerService {
  constructor(private readonly client: ShopifyAdminClient) {}
  async list(first = 50, after?: string) {
    return this.client.graphql(CUSTOMERS_QUERY, { first, after });
  }
}

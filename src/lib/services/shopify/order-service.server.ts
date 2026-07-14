/** Shopify Order service — read-only queries + attribution. */
import type { ShopifyAdminClient } from "./admin-client.server";

const ORDERS_QUERY = /* GraphQL */ `
  query Orders($first: Int!, $after: String, $query: String) {
    orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      pageInfo { hasNextPage endCursor }
      edges { node {
        id name createdAt displayFinancialStatus
        currentTotalPriceSet { shopMoney { amount currencyCode } }
        customer { id email }
        customAttributes { key value }
        lineItems(first: 20) { edges { node { title quantity product { id handle } } } }
      } }
    }
  }
`;

export class ShopifyOrderService {
  constructor(private readonly client: ShopifyAdminClient) {}
  async list(first = 50, after?: string, query?: string) {
    return this.client.graphql(ORDERS_QUERY, { first, after, query });
  }
  /** Orders attributed to a Videofy widget carry `videofy_widget_id` in customAttributes. */
  async byWidget(widgetId: string, first = 50) {
    return this.list(first, undefined, `note:${widgetId}`);
  }
}

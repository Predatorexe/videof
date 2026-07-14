/** Shopify Inventory service — quantity + location helpers. */
import type { ShopifyAdminClient } from "./admin-client.server";

const INVENTORY_LEVELS = /* GraphQL */ `
  query InventoryLevels($first: Int!) {
    locations(first: $first) {
      edges { node { id name inventoryLevels(first: 50) { edges { node { available item { id sku } } } } } }
    }
  }
`;

export class ShopifyInventoryService {
  constructor(private readonly client: ShopifyAdminClient) {}
  async levels(first = 10) { return this.client.graphql(INVENTORY_LEVELS, { first }); }
}

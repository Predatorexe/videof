/**
 * Product service — wraps Shopify Admin API for product read/write.
 * Ready to use once shop credentials are configured.
 */
import type { ShopifyAdminClient } from "./admin-client.server";

const PRODUCTS_QUERY = /* GraphQL */ `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          handle
          title
          descriptionHtml
          vendor
          productType
          status
          totalInventory
          featuredImage { url altText }
          priceRangeV2 {
            minVariantPrice { amount currencyCode }
            maxVariantPrice { amount currencyCode }
          }
          tags
        }
      }
    }
  }
`;

const PRODUCT_UPDATE = /* GraphQL */ `
  mutation ProductUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id updatedAt }
      userErrors { field message }
    }
  }
`;

export class ShopifyProductService {
  constructor(private readonly client: ShopifyAdminClient) {}

  async list(first = 50, after?: string) {
    return this.client.graphql<{
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: Array<{ node: unknown }>;
      };
    }>(PRODUCTS_QUERY, { first, after });
  }

  async update(input: { id: string; title?: string; tags?: string[] }) {
    return this.client.graphql(PRODUCT_UPDATE, { input });
  }
}

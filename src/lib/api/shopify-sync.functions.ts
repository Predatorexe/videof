/**
 * Shopify sync jobs.
 *
 * Public server functions callable from the embedded admin. Each one:
 *   1. Resolves the shop context from the session token (bearer JWT).
 *   2. Pages through the corresponding Admin GraphQL endpoint.
 *   3. Upserts rows into our local Postgres tables via supabaseAdmin
 *      (RLS-bypassing) keyed by `shopify_*_id`.
 *   4. Returns a summary `{ synced, pages }`.
 *
 * These are safe to call repeatedly — every write is an upsert on the
 * external ID, so the local mirror converges to Shopify's state.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { ShopifyProductService } from "@/lib/services/shopify/product-service.server";
import { ShopifyCollectionService } from "@/lib/services/shopify/collection-service.server";
import { ShopifyCustomerService } from "@/lib/services/shopify/customer-service.server";
import { ShopifyOrderService } from "@/lib/services/shopify/order-service.server";
import { requireShopContext } from "@/lib/services/shopify/shop-context.server";
import { logger } from "@/lib/logger";

const MAX_PAGES = 20; // Safety cap — 20 pages * 50/page = 1000 rows/call.

// ---------------------------------------------------------------- products
interface AdminProduct {
  id: string;
  handle: string | null;
  title: string;
  descriptionHtml: string | null;
  vendor: string | null;
  productType: string | null;
  status: string;
  featuredImage: { url: string | null } | null;
  priceRangeV2: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  } | null;
  tags: string[] | null;
}

export const syncShopifyProducts = createServerFn({ method: "POST" }).handler(async () => {
  const request = getWebRequest();
  if (!request) throw new Error("No request context");
  const ctx = await requireShopContext(request);
  const service = new ShopifyProductService(ctx.admin);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let after: string | undefined;
  let pages = 0;
  let synced = 0;

  do {
    const res = (await service.list(50, after)) as {
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: Array<{ node: AdminProduct }>;
      };
    };
    const rows = res.products.edges.map(({ node }) => ({
      shop_id: ctx.shop.id,
      shopify_product_id: node.id,
      handle: node.handle,
      title: node.title,
      description: node.descriptionHtml,
      vendor: node.vendor,
      product_type: node.productType,
      status: node.status?.toLowerCase() ?? null,
      image_url: node.featuredImage?.url ?? null,
      price_min: node.priceRangeV2 ? Number(node.priceRangeV2.minVariantPrice.amount) : null,
      price_max: node.priceRangeV2 ? Number(node.priceRangeV2.maxVariantPrice.amount) : null,
      currency: node.priceRangeV2?.minVariantPrice.currencyCode ?? null,
      tags: node.tags ?? [],
      updated_at: new Date().toISOString(),
    }));
    if (rows.length) {
      const { error } = await supabaseAdmin
        .from("products")
        .upsert(rows, { onConflict: "shopify_product_id" });
      if (error) throw new Error(`Product upsert failed: ${error.message}`);
      synced += rows.length;
    }
    after = res.products.pageInfo.hasNextPage ? res.products.pageInfo.endCursor ?? undefined : undefined;
    pages += 1;
  } while (after && pages < MAX_PAGES);

  logger.info("shopify.sync.products", { shop: ctx.shop.shopify_domain, synced, pages });
  return { synced, pages };
});

// ------------------------------------------------------------- collections
interface AdminCollection {
  id: string;
  handle: string;
  title: string;
  description: string | null;
  image: { url: string | null } | null;
}

export const syncShopifyCollections = createServerFn({ method: "POST" }).handler(async () => {
  const request = getWebRequest();
  if (!request) throw new Error("No request context");
  const ctx = await requireShopContext(request);
  const service = new ShopifyCollectionService(ctx.admin);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let after: string | undefined;
  let pages = 0;
  let synced = 0;

  do {
    const res = (await service.list(50, after)) as {
      collections: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: Array<{ node: AdminCollection }>;
      };
    };
    const rows = res.collections.edges.map(({ node }) => ({
      shop_id: ctx.shop.id,
      shopify_collection_id: node.id,
      handle: node.handle,
      title: node.title,
      description: node.description,
      image_url: node.image?.url ?? null,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length) {
      const { error } = await supabaseAdmin
        .from("collections")
        .upsert(rows, { onConflict: "shopify_collection_id" });
      if (error) throw new Error(`Collection upsert failed: ${error.message}`);
      synced += rows.length;
    }
    after = res.collections.pageInfo.hasNextPage ? res.collections.pageInfo.endCursor ?? undefined : undefined;
    pages += 1;
  } while (after && pages < MAX_PAGES);

  logger.info("shopify.sync.collections", { shop: ctx.shop.shopify_domain, synced, pages });
  return { synced, pages };
});

// --------------------------------------------------------------- customers
interface AdminCustomer {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  numberOfOrders: string | number | null;
  amountSpent: { amount: string; currencyCode: string } | null;
  tags: string[] | null;
}

export const syncShopifyCustomers = createServerFn({ method: "POST" }).handler(async () => {
  const request = getWebRequest();
  if (!request) throw new Error("No request context");
  const ctx = await requireShopContext(request);
  const service = new ShopifyCustomerService(ctx.admin);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let after: string | undefined;
  let pages = 0;
  let synced = 0;

  do {
    const res = (await service.list(50, after)) as {
      customers: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: Array<{ node: AdminCustomer }>;
      };
    };
    const rows = res.customers.edges.map(({ node }) => ({
      shop_id: ctx.shop.id,
      shopify_customer_id: node.id,
      email: node.email,
      first_name: node.firstName,
      last_name: node.lastName,
      total_orders: Number(node.numberOfOrders ?? 0) || 0,
      total_spent: node.amountSpent ? Number(node.amountSpent.amount) : 0,
      currency: node.amountSpent?.currencyCode ?? null,
      tags: node.tags ?? [],
      updated_at: new Date().toISOString(),
    }));
    if (rows.length) {
      const { error } = await supabaseAdmin
        .from("customers")
        .upsert(rows, { onConflict: "shopify_customer_id" });
      if (error) throw new Error(`Customer upsert failed: ${error.message}`);
      synced += rows.length;
    }
    after = res.customers.pageInfo.hasNextPage ? res.customers.pageInfo.endCursor ?? undefined : undefined;
    pages += 1;
  } while (after && pages < MAX_PAGES);

  logger.info("shopify.sync.customers", { shop: ctx.shop.shopify_domain, synced, pages });
  return { synced, pages };
});

// ------------------------------------------------------------------ orders
/**
 * Orders sync is *read-only* and used for widget attribution / analytics.
 * We do not currently mirror orders into a local table (no orders table
 * exists in the schema by design — see docs/DEVELOPER.md), so this
 * function returns the fetched page directly. Callers can pipe it into
 * an aggregator such as the analytics service.
 */
interface AdminOrderNode {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  currentTotalPriceSet: { shopMoney: { amount: string; currencyCode: string } } | null;
  customer: { id: string; email: string | null } | null;
  customAttributes: Array<{ key: string; value: string }>;
}

export const syncShopifyOrders = createServerFn({ method: "POST" })
  .inputValidator((input: { pages?: number; query?: string } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const request = getWebRequest();
    if (!request) throw new Error("No request context");
    const ctx = await requireShopContext(request);
    const service = new ShopifyOrderService(ctx.admin);

    let after: string | undefined;
    let pages = 0;
    const cap = Math.min(data.pages ?? 4, MAX_PAGES);
    const orders: AdminOrderNode[] = [];

    do {
      const res = (await service.list(50, after, data.query)) as {
        orders: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          edges: Array<{ node: AdminOrderNode }>;
        };
      };
      for (const edge of res.orders.edges) orders.push(edge.node);
      after = res.orders.pageInfo.hasNextPage ? res.orders.pageInfo.endCursor ?? undefined : undefined;
      pages += 1;
    } while (after && pages < cap);

    logger.info("shopify.sync.orders", { shop: ctx.shop.shopify_domain, synced: orders.length, pages });
    return { orders, pages };
  });

// ----------------------------------------------------------------- run-all
export const syncAllShopifyData = createServerFn({ method: "POST" }).handler(async () => {
  const [products, collections, customers] = await Promise.all([
    syncShopifyProducts(),
    syncShopifyCollections(),
    syncShopifyCustomers(),
  ]);
  return { products, collections, customers };
});

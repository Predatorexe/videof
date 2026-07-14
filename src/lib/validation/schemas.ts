/** Zod schemas shared between server functions and API routes. */
import { z } from "zod";

export const uuid = z.string().uuid();
export const nonEmpty = z.string().trim().min(1);
export const slug = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a kebab-case handle");

export const listQuerySchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  search: z.string().trim().max(200).optional(),
  sort: z.string().trim().max(64).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

/* ---------- Videos ---------- */
export const videoCreateSchema = z.object({
  shopId: uuid,
  title: nonEmpty.max(200),
  description: z.string().max(2000).optional(),
  sourceUrl: z.string().url().optional(),
  tags: z.array(z.string().trim().max(40)).max(50).optional(),
});
export const videoUpdateSchema = videoCreateSchema.partial().extend({ id: uuid });

/* ---------- Widgets ---------- */
export const widgetTypeEnum = z.enum([
  "homepage_carousel",
  "story",
  "floating",
  "product",
  "collection",
  "popup",
  "hero",
  "grid",
  "instagram_feed",
  "tiktok_feed",
]);
export const widgetCreateSchema = z.object({
  shopId: uuid,
  type: widgetTypeEnum,
  name: nonEmpty.max(120),
  handle: slug,
  config: z.record(z.string(), z.unknown()).default({}),
  customCss: z.string().max(50_000).optional(),
});
export const widgetUpdateSchema = widgetCreateSchema.partial().extend({ id: uuid });
export const widgetPublishSchema = z.object({ id: uuid });

/* ---------- Products ---------- */
export const productCreateSchema = z.object({
  shopId: uuid,
  shopifyProductId: nonEmpty,
  title: nonEmpty.max(200),
  handle: z.string().max(200).optional(),
  description: z.string().max(10_000).optional(),
  vendor: z.string().max(120).optional(),
  productType: z.string().max(120).optional(),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  priceMin: z.number().nonnegative().optional(),
  priceMax: z.number().nonnegative().optional(),
  currency: z.string().length(3).default("USD"),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});

/* ---------- Collections ---------- */
export const collectionCreateSchema = z.object({
  shopId: uuid,
  title: nonEmpty.max(200),
  handle: z.string().max(200).optional(),
  description: z.string().max(10_000).optional(),
  imageUrl: z.string().url().optional(),
});

/* ---------- Analytics ---------- */
export const analyticsEventSchema = z.object({
  shopId: uuid,
  widgetId: uuid.optional(),
  videoId: uuid.optional(),
  productId: uuid.optional(),
  eventType: z.enum([
    "impression",
    "view",
    "video_start",
    "video_complete",
    "cta_click",
    "add_to_cart",
    "buy_now",
    "order",
    "engagement",
  ]),
  sessionId: z.string().max(120).optional(),
  customerId: z.string().max(120).optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export const analyticsBatchSchema = z.object({
  events: z.array(analyticsEventSchema).min(1).max(200),
});

/* ---------- Notifications ---------- */
export const notificationCreateSchema = z.object({
  shopId: uuid,
  userId: uuid.optional(),
  kind: z.enum(["info", "success", "warning", "error"]).default("info"),
  title: nonEmpty.max(200),
  body: z.string().max(2000).optional(),
  link: z.string().url().optional(),
});

/* ---------- Settings / Profile ---------- */
export const profileUpdateSchema = z.object({
  fullName: z.string().max(160).optional(),
  avatarUrl: z.string().url().optional(),
  locale: z.string().max(10).optional(),
});
export const settingsUpdateSchema = z.object({
  shopId: uuid,
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  defaultLanguage: z.string().max(10).optional(),
  analyticsEnabled: z.boolean().optional(),
  storefrontDomain: z.string().max(255).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

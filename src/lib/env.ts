/**
 * Environment configuration.
 *
 * Server-only values live in process.env and are read INSIDE handlers
 * (Cloudflare Workers inject env per-request, so module-scope reads
 * return undefined).
 *
 * Public/publishable values use import.meta.env.VITE_*.
 */

/** Server-only. Call inside a server function/route handler. */
export function serverEnv() {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // Shopify — populated once a real Partner app exists.
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
    SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL,
    SHOPIFY_SCOPES: process.env.SHOPIFY_SCOPES,
    SHOPIFY_API_VERSION: process.env.SHOPIFY_API_VERSION ?? "2025-01",
    SHOPIFY_WEBHOOK_SECRET: process.env.SHOPIFY_WEBHOOK_SECRET,

    // Media providers (any one is enough).
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    MUX_TOKEN_ID: process.env.MUX_TOKEN_ID,
    MUX_TOKEN_SECRET: process.env.MUX_TOKEN_SECRET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ENDPOINT: process.env.S3_ENDPOINT,

    MEDIA_PROVIDER: (process.env.MEDIA_PROVIDER ?? "cloudinary") as
      | "cloudinary"
      | "mux"
      | "s3",
  };
}

/** Throws if the named vars are missing — call at the start of a handler. */
export function requireEnv<K extends keyof ReturnType<typeof serverEnv>>(
  ...keys: K[]
): Record<K, string> {
  const env = serverEnv();
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
  return Object.fromEntries(keys.map((k) => [k, env[k] as string])) as Record<
    K,
    string
  >;
}

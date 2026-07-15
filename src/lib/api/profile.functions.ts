/** Profile server functions. */
import { createServerFn } from "@tanstack/react-start";
import { requireShopifyOrSupabaseAuth as requireSupabaseAuth } from "@/lib/security/shopify-auth-middleware.server";
import { profileUpdateSchema } from "@/lib/validation/schemas";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => profileUpdateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("profiles").upsert({
      id: context.userId,
      full_name: data.fullName,
      avatar_url: data.avatarUrl,
      locale: data.locale,
    } as never).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

/**
 * Shop-context resolver.
 *
 * The App Bridge `<script>` tag and `shopify-api-key` meta are emitted
 * from the root route's `head()` so they're present in the initial SSR
 * HTML — a hard Shopify App Store requirement. This component no longer
 * injects them at runtime.
 *
 * On mount we try to resolve the caller's current shop:
 *   - If a Supabase session exists (standalone dashboard), use it.
 *   - Otherwise, rely on the App Bridge session token attacher — the
 *     server-side middleware turns it into a shop context.
 * If either path returns null we let the app render its mock/empty state
 * (Lovable preview / signed-out visitors).
 */
import { useEffect } from "react";
import { useShopStore } from "@/stores/shop-store";
import { getCurrentShop } from "@/lib/api/shop.functions";
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
      config: { apiKey: string; host: string };
    };
  }
}

export function ShopifyAppBridge() {
  const setShop = useShopStore((s) => s.setShop);
  const setStatus = useShopStore((s) => s.setStatus);

  useEffect(() => {
    let cancelled = false;
    setStatus("resolving");
    (async () => {
      try {
        // Prefer App Bridge session token when embedded — the serverFn
        // middleware verifies it and resolves the shop server-side.
        const hasEmbeddedToken = typeof window !== "undefined" && !!window.shopify?.idToken;
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!hasEmbeddedToken && !data.session) {
          setShop(null);
          return;
        }
        const shop = await getCurrentShop();
        if (cancelled) return;
        setShop(shop);
      } catch {
        if (!cancelled) setShop(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setShop, setStatus]);

  return null;
}

/**
 * Return a Shopify session token when embedded; null otherwise.
 * Callers merge this into the `X-Shopify-Session-Token` header before
 * hitting our own serverFn endpoints.
 */
export async function getShopifySessionToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  // App Bridge's CDN script is loaded from <head> but may not have executed
  // by the time the first serverFn RPC fires (React hydrates fast). Poll for
  // `window.shopify.idToken` for a short window before giving up so we don't
  // send an unauthenticated request from inside the Shopify admin iframe.
  const deadline = Date.now() + 5000;
  while (!window.shopify?.idToken) {
    if (Date.now() > deadline) return null;
    await new Promise((r) => setTimeout(r, 50));
  }
  try {
    return await window.shopify.idToken();
  } catch {
    return null;
  }
}

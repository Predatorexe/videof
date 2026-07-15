/**
 * App Bridge bootstrap + shop-context resolver.
 *
 * When the app runs inside the Shopify admin iframe (URL carries a `host`
 * parameter), we load the App Bridge CDN script and configure it with the
 * public API key. Outside Shopify (Lovable preview / standalone dashboard)
 * this returns null and no App Bridge is injected.
 *
 * On mount we also try to resolve the caller's current shop from the
 * database (`api.shop.getCurrentShop`). If it resolves, we push the id into
 * `useShopStore`, which triggers hydration of every domain store from the
 * server. If it fails or returns null, the stores keep using their mock
 * seed data — this is the intended fallback for the preview.
 */
import { useEffect, useState } from "react";
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
  const [ready, setReady] = useState(false);
  const setShop = useShopStore((s) => s.setShop);
  const setStatus = useShopStore((s) => s.setStatus);

  // Resolve the active shop for the signed-in merchant once on mount.
  // Skip entirely when there is no Supabase session (Lovable preview,
  // signed-out visitors) so we don't fire an unauthorized RPC.
  useEffect(() => {
    let cancelled = false;
    setStatus("resolving");
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!data.session) { setShop(null); return; }
        const shop = await getCurrentShop();
        if (cancelled) return;
        setShop(shop);
      } catch {
        if (!cancelled) setShop(null);
      }
    })();
    return () => { cancelled = true; };
  }, [setShop, setStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = new URLSearchParams(window.location.search).get("host");
    if (!host) return; // Not embedded — no-op.
    if (ready || document.querySelector('script[data-app-bridge]')) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/public/shopify/config");
        if (!res.ok) return;
        const { apiKey } = (await res.json()) as { apiKey: string };
        if (!apiKey || cancelled) return;

        const meta = document.createElement("meta");
        meta.name = "shopify-api-key";
        meta.content = apiKey;
        document.head.appendChild(meta);

        const script = document.createElement("script");
        script.src = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
        script.setAttribute("data-app-bridge", "true");
        script.async = true;
        script.onload = () => setReady(true);
        document.head.appendChild(script);
      } catch {
        // Silent — embedded mode is optional.
      }
    })();
    return () => { cancelled = true; };
  }, [ready]);

  return null;
}

/**
 * Return a Shopify session token when embedded; null otherwise.
 * Callers merge this into the Authorization header before hitting
 * our own /api/public/* or serverFn endpoints.
 */
export async function getShopifySessionToken(): Promise<string | null> {
  if (typeof window === "undefined" || !window.shopify?.idToken) return null;
  try {
    return await window.shopify.idToken();
  } catch {
    return null;
  }
}

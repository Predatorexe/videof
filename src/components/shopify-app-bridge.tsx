/**
 * App Bridge bootstrap.
 *
 * When the app runs *inside* the Shopify admin iframe (URL carries a
 * `host` parameter set by Shopify), we load the App Bridge CDN script
 * and configure it with the public API key. Outside Shopify (standalone
 * dashboard / dev) this component renders nothing — the standalone
 * routes continue to work exactly as before.
 *
 * The bridge exposes `window.shopify` which lets us fetch a Shopify
 * session token to attach to every authenticated fetch to our own
 * server routes (see attachShopifySessionToken).
 */
import { useEffect, useState } from "react";

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

/**
 * Settings store.
 *
 * The `shop_settings` table has first-class columns for a few keys
 * (brand_color, accent_color, default_language, storefront_domain,
 * analytics_enabled). Every other section lives inside the flexible
 * `data` jsonb column so the existing UI keeps working without a schema
 * change. In Lovable preview mode (no shop) the store behaves exactly as
 * before with defaults + in-memory saves.
 */
import { create } from "zustand";
import { toast } from "sonner";
import { getShopId } from "@/stores/shop-store";
import { subscribeShopHydration } from "@/lib/adapters/shop-hydration";
import { getSettings, updateSettings } from "@/lib/api/settings.functions";

export type GeneralSettings = {
  workspaceName: string;
  website: string;
  language: string;
  timezone: string;
};

export type AppearanceSettings = {
  brandColor: string;
  widgetTheme: string;
};

export type NotificationSettings = {
  uploadSuccess: boolean;
  uploadFailed: boolean;
  billingAlerts: boolean;
  weeklyDigest: boolean;
  productNewsletter: boolean;
};

export type SecuritySettings = {
  twoFactor: boolean;
  requireSso: boolean;
};

export type ApiSettings = {
  publishableKey: string;
  secretKey: string;
  webhookEndpoint: string;
};

type SettingsState = {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  api: ApiSettings;
  _shopId: string | null;
  _hydrated: boolean;
  saveGeneral: (v: GeneralSettings) => void;
  saveAppearance: (v: AppearanceSettings) => void;
  saveNotifications: (v: NotificationSettings) => void;
  saveSecurity: (v: SecuritySettings) => void;
  saveApi: (v: ApiSettings) => void;
  rotateKeys: () => void;
  hydrate: (shopId: string) => Promise<void>;
};

const DEFAULT_GENERAL: GeneralSettings = {
  workspaceName: "Atelier North",
  website: "https://atelier-north.com",
  language: "en",
  timezone: "Europe/Berlin",
};
const DEFAULT_APPEARANCE: AppearanceSettings = { brandColor: "#c8f542", widgetTheme: "dark" };
const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  uploadSuccess: true,
  uploadFailed: true,
  billingAlerts: true,
  weeklyDigest: false,
  productNewsletter: false,
};
const DEFAULT_SECURITY: SecuritySettings = { twoFactor: true, requireSso: false };
const DEFAULT_API: ApiSettings = {
  publishableKey: "vf_pub_9a4c2e1f_placeholder",
  secretKey: "vf_sk_••••••••••••••••",
  webhookEndpoint: "",
};

type PersistedData = {
  general?: Partial<GeneralSettings>;
  appearance?: Partial<AppearanceSettings>;
  notifications?: Partial<NotificationSettings>;
  security?: Partial<SecuritySettings>;
  api?: Partial<ApiSettings>;
};

async function persist(patch: PersistedData, cols?: { brandColor?: string; storefrontDomain?: string; defaultLanguage?: string }) {
  const shopId = getShopId();
  if (!shopId) return;
  const current = useSettingsStore.getState();
  const merged: PersistedData = {
    general: patch.general ?? current.general,
    appearance: patch.appearance ?? current.appearance,
    notifications: patch.notifications ?? current.notifications,
    security: patch.security ?? current.security,
    api: patch.api ?? current.api,
  };
  await updateSettings({
    data: {
      shopId,
      brandColor: cols?.brandColor,
      defaultLanguage: cols?.defaultLanguage,
      storefrontDomain: cols?.storefrontDomain,
      data: merged as Record<string, unknown>,
    },
  });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  general: DEFAULT_GENERAL,
  appearance: DEFAULT_APPEARANCE,
  notifications: DEFAULT_NOTIFICATIONS,
  security: DEFAULT_SECURITY,
  api: DEFAULT_API,
  _shopId: null,
  _hydrated: false,

  hydrate: async (shopId: string) => {
    try {
      const row = await getSettings({ data: { shopId } });
      const persisted = (row?.data ?? {}) as PersistedData;
      set({
        general: { ...DEFAULT_GENERAL, ...persisted.general },
        appearance: {
          ...DEFAULT_APPEARANCE,
          ...persisted.appearance,
          ...(row?.brand_color ? { brandColor: row.brand_color } : {}),
        },
        notifications: { ...DEFAULT_NOTIFICATIONS, ...persisted.notifications },
        security: { ...DEFAULT_SECURITY, ...persisted.security },
        api: { ...DEFAULT_API, ...persisted.api, ...(row?.data && (row.data as { webhookEndpoint?: string }).webhookEndpoint ? { webhookEndpoint: (row.data as { webhookEndpoint: string }).webhookEndpoint } : {}) },
        _shopId: shopId,
        _hydrated: true,
      });
    } catch (err) {
      if (!get()._hydrated) set({ _shopId: shopId, _hydrated: true });
      toast.error(err instanceof Error ? err.message : "Failed to load settings");
    }
  },

  saveGeneral: (v) => {
    const prev = get().general;
    set({ general: v });
    persist({ general: v }, { defaultLanguage: v.language }).catch((err) => {
      set({ general: prev });
      toast.error(err instanceof Error ? err.message : "Failed to save general settings");
    });
  },
  saveAppearance: (v) => {
    const prev = get().appearance;
    set({ appearance: v });
    persist({ appearance: v }, { brandColor: v.brandColor }).catch((err) => {
      set({ appearance: prev });
      toast.error(err instanceof Error ? err.message : "Failed to save appearance");
    });
  },
  saveNotifications: (v) => {
    const prev = get().notifications;
    set({ notifications: v });
    persist({ notifications: v }).catch((err) => {
      set({ notifications: prev });
      toast.error(err instanceof Error ? err.message : "Failed to save notification preferences");
    });
  },
  saveSecurity: (v) => {
    const prev = get().security;
    set({ security: v });
    persist({ security: v }).catch((err) => {
      set({ security: prev });
      toast.error(err instanceof Error ? err.message : "Failed to save security preferences");
    });
  },
  saveApi: (v) => {
    const prev = get().api;
    set({ api: v });
    persist({ api: v }).catch((err) => {
      set({ api: prev });
      toast.error(err instanceof Error ? err.message : "Failed to save API settings");
    });
  },
  rotateKeys: () => {
    const next: ApiSettings = {
      ...get().api,
      publishableKey: `vf_pub_${Math.random().toString(36).slice(2, 10)}`,
      secretKey: `vf_sk_${Math.random().toString(36).slice(2, 18)}`,
    };
    get().saveApi(next);
  },
}));

subscribeShopHydration({
  hydrate: (shopId) => useSettingsStore.getState().hydrate(shopId),
  reset: () =>
    useSettingsStore.setState({
      general: DEFAULT_GENERAL,
      appearance: DEFAULT_APPEARANCE,
      notifications: DEFAULT_NOTIFICATIONS,
      security: DEFAULT_SECURITY,
      api: DEFAULT_API,
      _shopId: null,
      _hydrated: false,
    }),
});

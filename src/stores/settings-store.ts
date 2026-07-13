import { create } from "zustand";

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
  saveGeneral: (v: GeneralSettings) => void;
  saveAppearance: (v: AppearanceSettings) => void;
  saveNotifications: (v: NotificationSettings) => void;
  saveSecurity: (v: SecuritySettings) => void;
  saveApi: (v: ApiSettings) => void;
  rotateKeys: () => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  general: {
    workspaceName: "Atelier North",
    website: "https://atelier-north.com",
    language: "en",
    timezone: "Europe/Berlin",
  },
  appearance: {
    brandColor: "#c8f542",
    widgetTheme: "dark",
  },
  notifications: {
    uploadSuccess: true,
    uploadFailed: true,
    billingAlerts: true,
    weeklyDigest: false,
    productNewsletter: false,
  },
  security: {
    twoFactor: true,
    requireSso: false,
  },
  api: {
    publishableKey: "vf_pub_9a4c2e1f_placeholder",
    secretKey: "vf_sk_••••••••••••••••",
    webhookEndpoint: "",
  },
  saveGeneral: (v) => set({ general: v }),
  saveAppearance: (v) => set({ appearance: v }),
  saveNotifications: (v) => set({ notifications: v }),
  saveSecurity: (v) => set({ security: v }),
  saveApi: (v) => set({ api: v }),
  rotateKeys: () =>
    set((s) => ({
      api: {
        ...s.api,
        publishableKey: `vf_pub_${Math.random().toString(36).slice(2, 10)}`,
        secretKey: `vf_sk_${Math.random().toString(36).slice(2, 18)}`,
      },
    })),
}));

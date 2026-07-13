// Centralized mock data. Swap these for real API calls at integration time.

export type Video = {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  clicks: number;
  status: "published" | "draft" | "processing";
  uploadedAt: string;
  size: string;
  tags: string[];
  productIds: string[];
};

export type Product = {
  id: string;
  title: string;
  image: string;
  price: number;
  inventory: number;
  status: "active" | "draft" | "archived";
  videoIds: string[];
  vendor: string;
};

export type Collection = {
  id: string;
  title: string;
  cover: string;
  productCount: number;
  videoCount: number;
  updatedAt: string;
};

export type WidgetType =
  | "carousel"
  | "floating"
  | "story"
  | "product"
  | "collection"
  | "popup"
  | "hero"
  | "instagram"
  | "tiktok"
  | "grid";

export type Widget = {
  id: string;
  name: string;
  type: WidgetType;
  enabled: boolean;
  placement: string;
  impressions: number;
  ctr: number;
  updatedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  lastSeen: string;
  avatar: string;
};

export type Invoice = {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  plan: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  kind: "success" | "info" | "warning" | "error";
  read: boolean;
};

// Deterministic seed so SSR and client render identical mock data (no hydration mismatch).
const EPOCH = Date.UTC(2026, 6, 13); // 2026-07-13
const daysAgo = (n: number) => new Date(EPOCH - n * 86400000).toISOString();
let __seed = 0x1a2b3c;
const rand = () => {
  __seed = (__seed * 1664525 + 1013904223) >>> 0;
  return __seed / 0xffffffff;
};
const rInt = (max: number) => Math.floor(rand() * max);

const thumbs = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1483721310020-03333e577078?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=640&auto=format&fit=crop&q=70",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=640&auto=format&fit=crop&q=70",
];

const videoTitles = [
  "Linen Overshirt — Field Test",
  "Runner 03 — First Miles",
  "Kettle Pour Study",
  "Studio Lamp — 60 seconds",
  "Denim Wash Story",
  "Ceramics Behind the Scenes",
  "Espresso Ritual",
  "Weekender Bag Unboxing",
  "Wool Coat Fit Guide",
  "Watch 42mm Hands-on",
  "Chair 01 — Assembly",
  "Perfume Notes: Cedar",
];

export const videos: Video[] = videoTitles.map((title, i) => ({
  id: `vid_${1000 + i}`,
  title,
  thumbnail: thumbs[i % thumbs.length],
  duration: `${rInt(2) + 0}:${String(rInt(55) + 5).padStart(2, "0")}`,
  views: 1200 + rInt(48000),
  clicks: 40 + rInt(3200),
  status: (["published", "published", "published", "draft", "processing"] as const)[i % 5],
  uploadedAt: daysAgo(i * 2 + 1),
  size: `${(6 + rand() * 40).toFixed(1)} MB`,
  tags: [["hero", "pdp", "campaign"][i % 3], ["ss24", "fw24", "core"][i % 3]],
  productIds: [`prd_${2000 + (i % 8)}`, `prd_${2000 + ((i + 3) % 8)}`],
}));

const productTitles = [
  "Linen Overshirt",
  "Runner 03",
  "Enamel Kettle",
  "Studio Lamp",
  "Selvedge Denim",
  "Stoneware Mug",
  "Weekender Duffle",
  "Wool Topcoat",
];

export const products: Product[] = productTitles.map((title, i) => ({
  id: `prd_${2000 + i}`,
  title,
  image: thumbs[(i + 2) % thumbs.length],
  price: [68, 149, 42, 129, 189, 24, 220, 385][i],
  inventory: 12 + rInt(240),
  status: (["active", "active", "active", "draft"] as const)[i % 4],
  videoIds: videos.filter((v) => v.productIds.includes(`prd_${2000 + i}`)).map((v) => v.id),
  vendor: ["Atelier North", "Field Studio", "Common Goods"][i % 3],
}));

const collectionTitles = [
  "Spring Essentials",
  "Behind the Craft",
  "New Arrivals",
  "The Studio Edit",
  "Weekend Kit",
  "Archive Sale",
];

export const collections: Collection[] = collectionTitles.map((title, i) => ({
  id: `col_${3000 + i}`,
  title,
  cover: thumbs[(i + 5) % thumbs.length],
  productCount: 6 + rInt(24),
  videoCount: 3 + rInt(12),
  updatedAt: daysAgo(i + 1),
}));

export const widgets: Widget[] = [
  { id: "wid_1", name: "Homepage Reel Carousel", type: "carousel", enabled: true, placement: "Homepage", impressions: 48210, ctr: 4.8, updatedAt: daysAgo(1) },
  { id: "wid_2", name: "Floating Bubble — SS24", type: "floating", enabled: true, placement: "Site-wide", impressions: 92140, ctr: 2.1, updatedAt: daysAgo(2) },
  { id: "wid_3", name: "PDP Story Strip", type: "story", enabled: true, placement: "Product Pages", impressions: 31820, ctr: 6.4, updatedAt: daysAgo(3) },
  { id: "wid_4", name: "Runner 03 Product Reel", type: "product", enabled: false, placement: "Product: Runner 03", impressions: 4210, ctr: 8.9, updatedAt: daysAgo(4) },
  { id: "wid_5", name: "New Arrivals Grid", type: "grid", enabled: true, placement: "Collection Page", impressions: 18320, ctr: 5.2, updatedAt: daysAgo(5) },
  { id: "wid_6", name: "Exit Popup — Studio Edit", type: "popup", enabled: false, placement: "Homepage", impressions: 8210, ctr: 3.4, updatedAt: daysAgo(6) },
  { id: "wid_7", name: "Hero Banner Video", type: "hero", enabled: true, placement: "Homepage", impressions: 61220, ctr: 7.1, updatedAt: daysAgo(7) },
  { id: "wid_8", name: "Instagram Feed Wall", type: "instagram", enabled: true, placement: "Homepage", impressions: 24120, ctr: 3.9, updatedAt: daysAgo(8) },
  { id: "wid_9", name: "TikTok Reel Row", type: "tiktok", enabled: false, placement: "Blog", impressions: 5120, ctr: 4.1, updatedAt: daysAgo(9) },
  { id: "wid_10", name: "Collection Carousel", type: "collection", enabled: true, placement: "Collection Page", impressions: 12420, ctr: 5.8, updatedAt: daysAgo(10) },
];

const firstNames = ["Ava", "Noah", "Mira", "Ilya", "Sena", "Kai", "Jules", "Rio", "Nina", "Owen", "Zara", "Theo"];
const lastNames = ["Okafor", "Larsen", "Petit", "Volkov", "Aoki", "Fischer", "Marchand", "Silva", "Duval", "Wright", "Haddad", "Yamada"];

export const customers: Customer[] = firstNames.map((f, i) => ({
  id: `cus_${4000 + i}`,
  name: `${f} ${lastNames[i]}`,
  email: `${f.toLowerCase()}.${lastNames[i].toLowerCase()}@example.com`,
  orders: 1 + rInt(32),
  spent: Math.floor(80 + rand() * 4200),
  lastSeen: daysAgo(i),
  avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${f}${lastNames[i]}`,
}));

export const invoices: Invoice[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `inv_${5000 + i}`,
  number: `VF-2026-${String(1042 - i).padStart(4, "0")}`,
  date: daysAgo(i * 30 + 3),
  amount: [49, 49, 149, 149, 49, 49, 49, 49][i],
  status: (i === 1 ? "pending" : i === 5 ? "failed" : "paid") as Invoice["status"],
  plan: i < 2 ? "Growth" : "Starter",
}));

export const notifications: NotificationItem[] = [
  { id: "n1", title: "Upload complete", body: "Linen Overshirt — Field Test finished processing.", time: "2m", kind: "success", read: false },
  { id: "n2", title: "Widget conversion up", body: "PDP Story Strip CTR increased 18% this week.", time: "1h", kind: "info", read: false },
  { id: "n3", title: "Impressions at 82% of plan", body: "You've used 16,400 of 20,000 monthly impressions. Overage will auto-bill at $5 / 10K.", time: "5h", kind: "warning", read: false },
  { id: "n4", title: "Invoice paid", body: "VF-2026-1041 — $49.00 charged successfully.", time: "1d", kind: "success", read: true },
  { id: "n5", title: "New product synced", body: "8 products imported from your catalog.", time: "2d", kind: "info", read: true },
  { id: "n6", title: "Import failed", body: "Instagram reel URL returned 404.", time: "3d", kind: "error", read: true },
];

// ---- charts ----

export const viewsTrend = Array.from({ length: 28 }).map((_, i) => ({
  day: `D${i + 1}`,
  views: 800 + Math.round(Math.sin(i / 3) * 300 + rand() * 400 + i * 40),
  clicks: 40 + Math.round(Math.cos(i / 4) * 20 + rand() * 30 + i * 3),
}));

export const revenueTrend = Array.from({ length: 12 }).map((_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  revenue: 2400 + Math.round(rand() * 3200 + i * 220),
  refunds: 80 + Math.round(rand() * 200),
}));

export const trafficSources = [
  { name: "Direct", value: 42 },
  { name: "Organic", value: 28 },
  { name: "Social", value: 18 },
  { name: "Email", value: 8 },
  { name: "Referral", value: 4 },
];

export const topVideos = videos
  .slice()
  .sort((a, b) => b.views - a.views)
  .slice(0, 5);

export const topWidgets = widgets
  .slice()
  .sort((a, b) => b.ctr - a.ctr)
  .slice(0, 5);

// ---- utils ----
export const fmt = {
  n: (v: number) => new Intl.NumberFormat("en-US").format(v),
  compact: (v: number) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v),
  money: (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v),
  pct: (v: number) => `${v.toFixed(1)}%`,
  date: (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
};

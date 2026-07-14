
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('owner','admin','staff');
CREATE TYPE public.subscription_plan AS ENUM ('starter','growth','scale','enterprise');
CREATE TYPE public.subscription_status AS ENUM ('trialing','active','past_due','cancelled','frozen');
CREATE TYPE public.invoice_status AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE public.video_status AS ENUM ('uploading','processing','ready','failed','archived');
CREATE TYPE public.widget_type AS ENUM ('homepage_carousel','story','floating','product','collection','popup','hero','grid','instagram_feed','tiktok_feed');
CREATE TYPE public.widget_status AS ENUM ('draft','published','archived');
CREATE TYPE public.analytics_event_type AS ENUM ('impression','view','video_start','video_complete','cta_click','add_to_cart','buy_now','order','engagement');
CREATE TYPE public.notification_kind AS ENUM ('info','success','warning','error');
CREATE TYPE public.media_kind AS ENUM ('video','image','thumbnail','poster');

CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_domain TEXT UNIQUE NOT NULL,
  shopify_shop_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT, country_code TEXT,
  currency TEXT DEFAULT 'USD', timezone TEXT DEFAULT 'UTC',
  plan_name TEXT, installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uninstalled_at TIMESTAMPTZ, access_token_encrypted TEXT, scopes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX shops_domain_idx ON public.shops(shopify_domain);
GRANT SELECT ON public.shops TO authenticated;
GRANT ALL ON public.shops TO service_role;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, shop_id, role)
);
CREATE INDEX user_roles_user_idx ON public.user_roles(user_id);
CREATE INDEX user_roles_shop_idx ON public.user_roles(shop_id);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_shop_access(_user_id UUID, _shop_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND shop_id = _shop_id);
$$;
CREATE OR REPLACE FUNCTION public.has_shop_role(_user_id UUID, _shop_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND shop_id = _shop_id AND role = _role);
$$;

CREATE POLICY "Staff can view their shop" ON public.shops FOR SELECT TO authenticated
  USING (public.has_shop_access(auth.uid(), id));
CREATE POLICY "Users can view roles in their shops" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, avatar_url TEXT, email TEXT, locale TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read"   ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shopify_product_id TEXT NOT NULL,
  handle TEXT, title TEXT NOT NULL, description TEXT, vendor TEXT, product_type TEXT,
  status TEXT DEFAULT 'active',
  price_min NUMERIC(12,2), price_max NUMERIC(12,2), currency TEXT DEFAULT 'USD',
  image_url TEXT, tags TEXT[] DEFAULT '{}', metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, shopify_product_id)
);
CREATE INDEX products_shop_idx ON public.products(shop_id);
CREATE INDEX products_handle_idx ON public.products(shop_id, handle);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id))
  WITH CHECK (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shopify_collection_id TEXT, handle TEXT, title TEXT NOT NULL, description TEXT, image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, shopify_collection_id)
);
CREATE INDEX collections_shop_idx ON public.collections(shop_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;
GRANT ALL ON public.collections TO service_role;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage collections" ON public.collections FOR ALL TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id))
  WITH CHECK (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.collection_products (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);
CREATE INDEX collection_products_product_idx ON public.collection_products(product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_products TO authenticated;
GRANT ALL ON public.collection_products TO service_role;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage collection_products" ON public.collection_products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND public.has_shop_access(auth.uid(), c.shop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND public.has_shop_access(auth.uid(), c.shop_id)));

CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT,
  status public.video_status NOT NULL DEFAULT 'uploading',
  source_url TEXT, hls_url TEXT, mp4_url TEXT, poster_url TEXT, thumbnail_url TEXT,
  duration_seconds NUMERIC(10,2), width INTEGER, height INTEGER, size_bytes BIGINT,
  provider TEXT, provider_asset_id TEXT,
  tags TEXT[] DEFAULT '{}', metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX videos_shop_idx ON public.videos(shop_id);
CREATE INDEX videos_status_idx ON public.videos(shop_id, status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage videos" ON public.videos FOR ALL TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id))
  WITH CHECK (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.video_products (
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0, cta_label TEXT, timestamp_ms INTEGER,
  PRIMARY KEY (video_id, product_id)
);
CREATE INDEX video_products_product_idx ON public.video_products(product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_products TO authenticated;
GRANT ALL ON public.video_products TO service_role;
ALTER TABLE public.video_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage video_products" ON public.video_products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_id AND public.has_shop_access(auth.uid(), v.shop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.videos v WHERE v.id = video_id AND public.has_shop_access(auth.uid(), v.shop_id)));

CREATE TABLE public.widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  type public.widget_type NOT NULL,
  name TEXT NOT NULL, handle TEXT NOT NULL,
  status public.widget_status NOT NULL DEFAULT 'draft',
  published_version_id UUID,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  custom_css TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, handle)
);
CREATE INDEX widgets_shop_idx ON public.widgets(shop_id);
CREATE INDEX widgets_status_idx ON public.widgets(shop_id, status);
GRANT SELECT ON public.widgets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.widgets TO authenticated;
GRANT ALL ON public.widgets TO service_role;
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage widgets" ON public.widgets FOR ALL TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id))
  WITH CHECK (public.has_shop_access(auth.uid(), shop_id));
CREATE POLICY "Public read published widgets" ON public.widgets FOR SELECT TO anon
  USING (status = 'published');

CREATE TABLE public.widget_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  config JSONB NOT NULL, custom_css TEXT,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (widget_id, version)
);
CREATE INDEX widget_versions_widget_idx ON public.widget_versions(widget_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.widget_versions TO authenticated;
GRANT ALL ON public.widget_versions TO service_role;
ALTER TABLE public.widget_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage widget_versions" ON public.widget_versions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.widgets w WHERE w.id = widget_id AND public.has_shop_access(auth.uid(), w.shop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.widgets w WHERE w.id = widget_id AND public.has_shop_access(auth.uid(), w.shop_id)));

CREATE TABLE public.widget_videos (
  widget_id UUID NOT NULL REFERENCES public.widgets(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  PRIMARY KEY (widget_id, video_id)
);
CREATE INDEX widget_videos_video_idx ON public.widget_videos(video_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.widget_videos TO authenticated;
GRANT ALL ON public.widget_videos TO service_role;
ALTER TABLE public.widget_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage widget_videos" ON public.widget_videos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.widgets w WHERE w.id = widget_id AND public.has_shop_access(auth.uid(), w.shop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.widgets w WHERE w.id = widget_id AND public.has_shop_access(auth.uid(), w.shop_id)));

CREATE TABLE public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES public.widgets(id) ON DELETE SET NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  event_type public.analytics_event_type NOT NULL,
  session_id TEXT, customer_id TEXT,
  amount NUMERIC(12,2), currency TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ae_shop_time_idx    ON public.analytics_events(shop_id, occurred_at DESC);
CREATE INDEX ae_widget_time_idx  ON public.analytics_events(widget_id, occurred_at DESC);
CREATE INDEX ae_video_time_idx   ON public.analytics_events(video_id, occurred_at DESC);
CREATE INDEX ae_type_idx         ON public.analytics_events(shop_id, event_type, occurred_at DESC);
GRANT INSERT ON public.analytics_events TO anon;
GRANT INSERT, SELECT ON public.analytics_events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.analytics_events_id_seq TO anon, authenticated;
GRANT ALL ON public.analytics_events TO service_role;
GRANT ALL ON SEQUENCE public.analytics_events_id_seq TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert events"  ON public.analytics_events FOR INSERT TO anon           WITH CHECK (true);
CREATE POLICY "Auth can insert events"    ON public.analytics_events FOR INSERT TO authenticated  WITH CHECK (true);
CREATE POLICY "Shop staff read analytics" ON public.analytics_events FOR SELECT TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.analytics_daily (
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  widget_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  video_id  UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  impressions INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  video_starts INTEGER DEFAULT 0,
  video_completes INTEGER DEFAULT 0,
  cta_clicks INTEGER DEFAULT 0,
  add_to_cart INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue NUMERIC(14,2) DEFAULT 0,
  PRIMARY KEY (shop_id, day, widget_id, video_id)
);
GRANT SELECT ON public.analytics_daily TO authenticated;
GRANT ALL ON public.analytics_daily TO service_role;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff read daily rollup" ON public.analytics_daily FOR SELECT TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shopify_customer_id TEXT,
  email TEXT, first_name TEXT, last_name TEXT,
  total_orders INTEGER DEFAULT 0, total_spent NUMERIC(14,2) DEFAULT 0, currency TEXT,
  tags TEXT[] DEFAULT '{}', metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, shopify_customer_id)
);
CREATE INDEX customers_shop_idx ON public.customers(shop_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage customers" ON public.customers FOR ALL TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id))
  WITH CHECK (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL UNIQUE REFERENCES public.shops(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'starter',
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  shopify_charge_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  impression_limit INTEGER,
  impression_used INTEGER DEFAULT 0,
  overage_impressions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff read subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.invoice_status NOT NULL DEFAULT 'pending',
  shopify_invoice_id TEXT,
  period_start TIMESTAMPTZ, period_end TIMESTAMPTZ, paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX invoices_shop_idx ON public.invoices(shop_id, created_at DESC);
GRANT SELECT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff read invoices" ON public.invoices FOR SELECT TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.notification_kind NOT NULL DEFAULT 'info',
  title TEXT NOT NULL, body TEXT, link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_shop_idx ON public.notifications(shop_id, created_at DESC);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff read notifications" ON public.notifications FOR SELECT TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id));
CREATE POLICY "User marks own notification"   ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.activity_logs (
  id BIGSERIAL PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, resource_type TEXT, resource_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activity_shop_idx ON public.activity_logs(shop_id, created_at DESC);
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.activity_logs_id_seq TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff read activity" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.shop_settings (
  shop_id UUID PRIMARY KEY REFERENCES public.shops(id) ON DELETE CASCADE,
  brand_color TEXT DEFAULT '#111111',
  accent_color TEXT DEFAULT '#4f46e5',
  default_language TEXT DEFAULT 'en',
  analytics_enabled BOOLEAN DEFAULT true,
  storefront_domain TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, INSERT ON public.shop_settings TO authenticated;
GRANT ALL ON public.shop_settings TO service_role;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage settings" ON public.shop_settings FOR ALL TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id))
  WITH CHECK (public.has_shop_access(auth.uid(), shop_id));

CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  kind public.media_kind NOT NULL,
  url TEXT NOT NULL, provider TEXT, provider_asset_id TEXT,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  width INTEGER, height INTEGER, size_bytes BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX media_shop_idx ON public.media_assets(shop_id);
CREATE INDEX media_video_idx ON public.media_assets(video_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shop staff manage media" ON public.media_assets FOR ALL TO authenticated
  USING (public.has_shop_access(auth.uid(), shop_id))
  WITH CHECK (public.has_shop_access(auth.uid(), shop_id));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_shops_updated       BEFORE UPDATE ON public.shops         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_profiles_updated    BEFORE UPDATE ON public.profiles      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_products_updated    BEFORE UPDATE ON public.products      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_collections_updated BEFORE UPDATE ON public.collections   FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_videos_updated      BEFORE UPDATE ON public.videos        FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_widgets_updated     BEFORE UPDATE ON public.widgets       FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_customers_updated   BEFORE UPDATE ON public.customers     FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_subs_updated        BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_settings_updated    BEFORE UPDATE ON public.shop_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.widgets
  ADD CONSTRAINT widgets_published_version_fk
  FOREIGN KEY (published_version_id) REFERENCES public.widget_versions(id) ON DELETE SET NULL;

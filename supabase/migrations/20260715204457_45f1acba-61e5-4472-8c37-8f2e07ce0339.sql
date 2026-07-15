ALTER TABLE public.products ADD COLUMN IF NOT EXISTS inventory integer NOT NULL DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS click_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS publish_meta jsonb NOT NULL DEFAULT '{}'::jsonb;
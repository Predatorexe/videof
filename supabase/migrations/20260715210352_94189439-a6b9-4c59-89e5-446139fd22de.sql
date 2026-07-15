ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pending_plan public.subscription_plan NULL,
  ADD COLUMN IF NOT EXISTS pending_charge_id text NULL,
  ADD COLUMN IF NOT EXISTS pending_confirmation_url text NULL,
  ADD COLUMN IF NOT EXISTS currency_code text NULL,
  ADD COLUMN IF NOT EXISTS test_charge boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS subscriptions_pending_charge_id_idx
  ON public.subscriptions (pending_charge_id)
  WHERE pending_charge_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_shopify_charge_id_idx
  ON public.subscriptions (shopify_charge_id)
  WHERE shopify_charge_id IS NOT NULL;
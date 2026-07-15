CREATE TABLE public.gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE SET NULL,
  shop_domain text NOT NULL,
  topic text NOT NULL,
  customer_shopify_id text,
  customer_email text,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'received',
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gdpr_requests_shop_idx ON public.gdpr_requests(shop_id, received_at DESC);
CREATE INDEX gdpr_requests_domain_idx ON public.gdpr_requests(shop_domain, topic);

GRANT SELECT ON public.gdpr_requests TO authenticated;
GRANT ALL ON public.gdpr_requests TO service_role;

ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop members can view their GDPR requests"
  ON public.gdpr_requests
  FOR SELECT
  TO authenticated
  USING (shop_id IS NOT NULL AND public.has_shop_access(auth.uid(), shop_id));

CREATE TRIGGER trg_gdpr_requests_updated_at
  BEFORE UPDATE ON public.gdpr_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
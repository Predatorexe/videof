
CREATE TABLE public.shop_oauth_states (
  state text PRIMARY KEY,
  shop_domain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

CREATE INDEX shop_oauth_states_expires_at_idx ON public.shop_oauth_states (expires_at);

GRANT ALL ON public.shop_oauth_states TO service_role;
ALTER TABLE public.shop_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role manages oauth states"
  ON public.shop_oauth_states FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

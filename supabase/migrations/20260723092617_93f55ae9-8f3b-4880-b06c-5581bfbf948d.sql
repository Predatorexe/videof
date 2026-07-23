
-- Rate limits table for production-grade throttling.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies: table is only accessed by service_role via the RPC below.
-- (RLS enabled with zero policies denies anon/authenticated by default.)

CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON public.rate_limits (expires_at);

-- Atomic sliding-window rate limiter. Each key maintains its own window,
-- automatically reset when the previous window expires. Concurrent callers
-- serialize through the ON CONFLICT UPSERT so counts stay accurate.
CREATE OR REPLACE FUNCTION public.rate_limit_check(
  _key text,
  _max integer,
  _window_ms integer
)
RETURNS TABLE(allowed boolean, current_count integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _now timestamptz := now();
  _window interval := make_interval(secs => _window_ms / 1000.0);
  _row public.rate_limits%ROWTYPE;
BEGIN
  -- Opportunistic sweep of expired rows (bounded to avoid long transactions).
  DELETE FROM public.rate_limits
   WHERE key IN (
     SELECT key FROM public.rate_limits WHERE expires_at < _now - interval '5 minutes' LIMIT 100
   );

  INSERT INTO public.rate_limits (key, count, window_start, expires_at, updated_at)
  VALUES (_key, 1, _now, _now + _window, _now)
  ON CONFLICT (key) DO UPDATE
    SET count = CASE
                  WHEN public.rate_limits.expires_at <= _now THEN 1
                  ELSE public.rate_limits.count + 1
                END,
        window_start = CASE
                         WHEN public.rate_limits.expires_at <= _now THEN _now
                         ELSE public.rate_limits.window_start
                       END,
        expires_at = CASE
                       WHEN public.rate_limits.expires_at <= _now THEN _now + _window
                       ELSE public.rate_limits.expires_at
                     END,
        updated_at = _now
  RETURNING * INTO _row;

  RETURN QUERY SELECT (_row.count <= _max), _row.count, _row.expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_check(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rate_limit_check(text, integer, integer) TO service_role;

-- Scheduled cleanup of stale buckets (belt-and-suspenders alongside the
-- opportunistic sweep in rate_limit_check). Runs every 10 minutes.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('rate_limits_cleanup') FROM cron.job WHERE jobname = 'rate_limits_cleanup';
    PERFORM cron.schedule(
      'rate_limits_cleanup',
      '*/10 * * * *',
      $cron$DELETE FROM public.rate_limits WHERE expires_at < now() - interval '10 minutes'$cron$
    );
  END IF;
END $$;

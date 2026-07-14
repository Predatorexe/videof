
-- Narrow the always-true analytics INSERT policies to require the shop exists.
DROP POLICY IF EXISTS "Public can insert events" ON public.analytics_events;
DROP POLICY IF EXISTS "Auth can insert events"   ON public.analytics_events;

CREATE POLICY "Public can insert events for known shop" ON public.analytics_events
  FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.uninstalled_at IS NULL));

CREATE POLICY "Auth can insert events for known shop" ON public.analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.uninstalled_at IS NULL));

-- Anon must be able to read shops row (for the EXISTS above via RLS bypass in policy check happens as the invoker;
-- policy check runs bypassing RLS on referenced tables, so no extra grant needed).

-- Revoke public/anon EXECUTE on the security-definer helpers.
REVOKE EXECUTE ON FUNCTION public.has_shop_access(UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_shop_role(UUID, UUID, public.app_role) FROM PUBLIC, anon;

-- Keep EXECUTE for authenticated + service_role (required so RLS policies can call them).
GRANT EXECUTE ON FUNCTION public.has_shop_access(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_shop_role(UUID, UUID, public.app_role) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_platform_admin();
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_platform_admin_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.platform_admins
    WHERE user_id = target_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin_user(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin_user(uuid)
  TO service_role;

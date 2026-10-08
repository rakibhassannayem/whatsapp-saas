-- These RPCs are called only by the trusted server after its separate
-- platform-admin session check. The service-role key must never reach a browser.

CREATE OR REPLACE FUNCTION public.ensure_platform_admin_by_email(target_email text)
RETURNS TABLE (user_id uuid, was_already_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_column
DECLARE
  target_user_id uuid;
  already_admin boolean;
BEGIN
  SELECT auth_user.id
  INTO target_user_id
  FROM auth.users AS auth_user
  WHERE lower(auth_user.email) = lower(btrim(target_email))
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM private.platform_admins AS platform_admin
    WHERE platform_admin.user_id = target_user_id
  )
  INTO already_admin;

  INSERT INTO private.platform_admins (user_id, created_at)
  VALUES (target_user_id, now())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY SELECT target_user_id, already_admin;
END;
$$;

-- After inviteUserByEmail succeeds, use the Auth user ID returned by Supabase
-- instead of looking up the just-created account by email a second time.
CREATE OR REPLACE FUNCTION public.ensure_platform_admin_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users AS auth_user WHERE auth_user.id = target_user_id
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO private.platform_admins (user_id, created_at)
  VALUES (target_user_id, now())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN EXISTS (
    SELECT 1
    FROM private.platform_admins AS platform_admin
    WHERE platform_admin.user_id = target_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_platform_admins()
RETURNS TABLE (user_id uuid, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT platform_admin.user_id, platform_admin.created_at
  FROM private.platform_admins AS platform_admin
  ORDER BY platform_admin.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.ensure_platform_admin_by_email(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_platform_admin_by_email(text)
  TO service_role;

REVOKE ALL ON FUNCTION public.ensure_platform_admin_user(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_platform_admin_user(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.list_platform_admins()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_platform_admins()
  TO service_role;

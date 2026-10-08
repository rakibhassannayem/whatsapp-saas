-- Track completion of the separate admin password setup.
ALTER TABLE private.platform_admins
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- Existing admins who already have an Auth password remain active.
UPDATE private.platform_admins AS platform_admin
SET activated_at = COALESCE(platform_admin.activated_at, auth_user.created_at)
FROM auth.users AS auth_user
WHERE auth_user.id = platform_admin.user_id
  AND NULLIF(auth_user.encrypted_password, '') IS NOT NULL;

-- When promoting an existing Auth account, mark it active only if a password
-- already exists. A newly invited account has no password yet.
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
  target_has_password boolean;
BEGIN
  SELECT auth_user.id,
         NULLIF(auth_user.encrypted_password, '') IS NOT NULL
  INTO target_user_id, target_has_password
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

  INSERT INTO private.platform_admins (user_id, created_at, activated_at)
  VALUES (
    target_user_id,
    now(),
    CASE WHEN target_has_password THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY SELECT target_user_id, already_admin;
END;
$$;

-- The list now returns the explicit activation marker instead of guessing from
-- email verification. Drop first because PostgreSQL cannot replace a table
-- function when its returned columns change.
DROP FUNCTION IF EXISTS public.list_platform_admins();

CREATE FUNCTION public.list_platform_admins()
RETURNS TABLE (
  user_id uuid,
  created_at timestamptz,
  activated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT platform_admin.user_id,
         platform_admin.created_at,
         platform_admin.activated_at
  FROM private.platform_admins AS platform_admin
  ORDER BY platform_admin.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.mark_platform_admin_activated(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE private.platform_admins AS platform_admin
  SET activated_at = COALESCE(platform_admin.activated_at, now())
  WHERE platform_admin.user_id = target_user_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_platform_admin(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  admin_count integer;
BEGIN
  LOCK TABLE private.platform_admins IN EXCLUSIVE MODE;

  IF NOT EXISTS (
    SELECT 1
    FROM private.platform_admins AS platform_admin
    WHERE platform_admin.user_id = target_user_id
  ) THEN
    RETURN 'not_found';
  END IF;

  SELECT count(*)::integer
  INTO admin_count
  FROM private.platform_admins;

  IF admin_count <= 1 THEN
    RETURN 'last_admin';
  END IF;

  DELETE FROM private.platform_admins AS platform_admin
  WHERE platform_admin.user_id = target_user_id;

  RETURN 'removed';
END;
$$;

REVOKE ALL ON FUNCTION public.list_platform_admins()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_platform_admins()
  TO service_role;

REVOKE ALL ON FUNCTION public.mark_platform_admin_activated(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_platform_admin_activated(uuid)
  TO service_role;

REVOKE ALL ON FUNCTION public.remove_platform_admin(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_platform_admin(uuid)
  TO service_role;

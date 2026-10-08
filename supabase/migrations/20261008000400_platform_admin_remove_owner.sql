-- Delete one business owner's tenant data in a single PostgreSQL transaction.
-- The server route separately deletes the Auth user after this function succeeds.
CREATE OR REPLACE FUNCTION public.platform_admin_remove_business_owner(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_business_ids uuid[];
  removed_business_count integer;
BEGIN
  SELECT array_agg(id)
  INTO target_business_ids
  FROM public.businesses
  WHERE created_by = target_user_id;

  removed_business_count := COALESCE(array_length(target_business_ids, 1), 0);

  IF removed_business_count = 0 THEN
    RETURN jsonb_build_object('business_count', 0);
  END IF;

  -- Remove rows that point to campaigns/customers before deleting those records.
  DELETE FROM public.campaign_recipients
  WHERE campaign_id IN (
    SELECT id FROM public.campaigns WHERE business_id = ANY(target_business_ids)
  );

  DELETE FROM public.customer_tags
  WHERE business_id = ANY(target_business_ids);

  -- Subscription tables are optional until their separate migration is applied.
  IF to_regclass('public.subscription_payments') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.subscription_payments WHERE business_id = ANY($1)'
      USING target_business_ids;
  END IF;

  IF to_regclass('public.business_subscriptions') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.business_subscriptions WHERE business_id = ANY($1)'
      USING target_business_ids;
  END IF;

  DELETE FROM public.campaigns
  WHERE business_id = ANY(target_business_ids);

  DELETE FROM public.customers
  WHERE business_id = ANY(target_business_ids);

  DELETE FROM public.tags
  WHERE business_id = ANY(target_business_ids);

  DELETE FROM public.message_templates
  WHERE business_id = ANY(target_business_ids);

  DELETE FROM public.business_memberships
  WHERE business_id = ANY(target_business_ids)
     OR user_id = target_user_id;

  DELETE FROM public.businesses
  WHERE id = ANY(target_business_ids);

  DELETE FROM public.profiles
  WHERE id = target_user_id;

  RETURN jsonb_build_object('business_count', removed_business_count);
END;
$$;

REVOKE ALL ON FUNCTION public.platform_admin_remove_business_owner(uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_admin_remove_business_owner(uuid)
  TO service_role;

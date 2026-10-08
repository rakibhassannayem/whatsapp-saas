-- Let signed-in users rename and delete only businesses they created.
-- Restrictive policies keep existing permissive policies from broadening access.

REVOKE UPDATE, DELETE ON TABLE public.businesses FROM anon, PUBLIC;
REVOKE UPDATE, DELETE ON TABLE public.businesses FROM authenticated;

GRANT UPDATE (name), DELETE ON TABLE public.businesses TO authenticated;

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Business creators can rename their businesses"
  ON public.businesses;
CREATE POLICY "Business creators can rename their businesses"
  ON public.businesses
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Business creator rename restriction"
  ON public.businesses;
CREATE POLICY "Business creator rename restriction"
  ON public.businesses
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by)
  WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Business creators can delete their businesses"
  ON public.businesses;
CREATE POLICY "Business creators can delete their businesses"
  ON public.businesses
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Business creator delete restriction"
  ON public.businesses;
CREATE POLICY "Business creator delete restriction"
  ON public.businesses
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = created_by);

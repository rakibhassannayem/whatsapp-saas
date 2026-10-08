-- Public plan cards can read active package information without exposing tenant billing.
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  billing_period text NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  price_amount numeric(12, 2) CHECK (price_amount IS NULL OR price_amount >= 0),
  currency text NOT NULL DEFAULT 'BDT',
  customer_limit integer CHECK (customer_limit IS NULL OR customer_limit >= 0),
  campaign_limit integer CHECK (campaign_limit IS NULL OR campaign_limit >= 0),
  monthly_message_limit integer CHECK (monthly_message_limit IS NULL OR monthly_message_limit >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscription_plans_billing_period_unique UNIQUE (billing_period)
);

INSERT INTO public.subscription_plans (name, billing_period)
VALUES ('Monthly', 'monthly'), ('Yearly', 'yearly')
ON CONFLICT (billing_period) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.business_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('trialing', 'active', 'expired', 'cancelled', 'past_due')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  customer_limit integer CHECK (customer_limit IS NULL OR customer_limit >= 0),
  campaign_limit integer CHECK (campaign_limit IS NULL OR campaign_limit >= 0),
  monthly_message_limit integer CHECK (monthly_message_limit IS NULL OR monthly_message_limit >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_subscriptions_business_created_idx
  ON public.business_subscriptions (business_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE RESTRICT,
  subscription_id uuid REFERENCES public.business_subscriptions(id) ON DELETE SET NULL,
  package_name text NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'BDT',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at timestamptz,
  payment_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_payments_business_paid_idx
  ON public.subscription_payments (business_id, paid_at DESC);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.subscription_plans FROM anon, authenticated;
GRANT SELECT ON TABLE public.subscription_plans TO anon, authenticated;
GRANT ALL ON TABLE public.subscription_plans TO service_role;

REVOKE ALL ON TABLE public.business_subscriptions FROM anon, authenticated;
GRANT ALL ON TABLE public.business_subscriptions TO service_role;

REVOKE ALL ON TABLE public.subscription_payments FROM anon, authenticated;
GRANT ALL ON TABLE public.subscription_payments TO service_role;

CREATE POLICY "Anyone can read active subscription plans"
  ON public.subscription_plans
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

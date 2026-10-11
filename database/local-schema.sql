-- Local PostgreSQL schema for the app's existing business features.
-- This file intentionally excludes Supabase Auth, RLS policies, Supabase roles,
-- platform-admin functions, and all table data.

CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 120),
  -- Kept as a UUID for now; it will connect to the chosen auth user table later.
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  -- This is a placeholder identity UUID until authentication is chosen later.
  id uuid PRIMARY KEY,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.business_memberships (
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  -- Kept as a UUID for now; it will connect to the chosen auth user table later.
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, user_id)
);

CREATE INDEX business_memberships_user_id_idx
  ON public.business_memberships (user_id);

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  full_name text NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 1 AND 120),
  phone_e164 text NOT NULL CHECK (phone_e164 ~ '^\+[1-9][0-9]{1,14}$'),
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, id),
  UNIQUE (business_id, phone_e164)
);

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 50),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, id)
);

CREATE UNIQUE INDEX tags_business_name_unique
  ON public.tags (business_id, lower(name));

CREATE TABLE public.customer_tags (
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, tag_id),
  FOREIGN KEY (business_id, customer_id)
    REFERENCES public.customers (business_id, id) ON DELETE CASCADE,
  FOREIGN KEY (business_id, tag_id)
    REFERENCES public.tags (business_id, id) ON DELETE CASCADE
);

CREATE INDEX customer_tags_tag_lookup_idx
  ON public.customer_tags (business_id, tag_id);

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  message_body text NOT NULL CHECK (char_length(trim(message_body)) > 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);

CREATE TABLE public.campaign_recipients (
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id, customer_id)
);

CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, name)
);

CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscription_plans (
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

CREATE TABLE public.business_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
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

CREATE INDEX business_subscriptions_business_created_idx
  ON public.business_subscriptions (business_id, created_at DESC);

CREATE TABLE public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
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

CREATE INDEX subscription_payments_business_paid_idx
  ON public.subscription_payments (business_id, paid_at DESC);


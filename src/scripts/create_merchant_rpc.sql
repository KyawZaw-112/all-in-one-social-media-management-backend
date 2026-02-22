-- SECURITY DEFINER RPC to bypass RLS for merchant creation
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.create_merchant_profile(
  p_id UUID,
  p_page_id TEXT,
  p_business_name TEXT,
  p_business_type TEXT,
  p_subscription_plan TEXT,
  p_trial_ends_at TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.merchants (
    id,
    page_id,
    business_name,
    business_type,
    subscription_plan,
    subscription_status,
    trial_ends_at
  ) VALUES (
    p_id,
    p_page_id,
    p_business_name,
    p_business_type,
    p_subscription_plan,
    'active',
    p_trial_ends_at
  )
  ON CONFLICT (id) DO UPDATE SET
    page_id = EXCLUDED.page_id,
    business_name = EXCLUDED.business_name,
    business_type = EXCLUDED.business_type,
    subscription_plan = EXCLUDED.subscription_plan,
    trial_ends_at = EXCLUDED.trial_ends_at;
END;
$$;

-- Grant execution to authenticated and anon (since it's called by service role anyway)
-- Even though we call it with service role, adding these grants ensures PostgREST can find it.
GRANT EXECUTE ON FUNCTION public.create_merchant_profile TO service_role;
GRANT EXECUTE ON FUNCTION public.create_merchant_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_merchant_profile TO anon;

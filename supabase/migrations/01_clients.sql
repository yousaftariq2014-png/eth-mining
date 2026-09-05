-- Migration 01: Clients, Credentials Vault, Onchain Keys Vault
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

CREATE TABLE IF NOT EXISTS public.client_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  original_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_onchain_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  onchain_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

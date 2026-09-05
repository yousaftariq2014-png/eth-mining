-- Migration 04: Mining Contracts & Cloud Hashrate Rigs
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

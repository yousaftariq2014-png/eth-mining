-- Migration 02: Deposits Ledger
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

CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);

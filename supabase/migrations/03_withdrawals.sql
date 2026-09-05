-- Migration 03: Withdrawals Ledger & Admin Queue
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

CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_time ON public.withdrawals(time DESC);

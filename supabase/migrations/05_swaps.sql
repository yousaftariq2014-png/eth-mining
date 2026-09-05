-- Migration 05: Swaps (Mined ETH to USDT Exchanges)
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

CREATE INDEX IF NOT EXISTS idx_swaps_user_id ON public.swaps(user_id);

-- Migration 11: Continuous 24/7 Cloud Mining State & Realtime Hashrate Ledger
-- Stores persistent real-time mined ETH balances, node active states, and hashrate metrics

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

-- Indexes for lightning fast lookups on user login & page refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_mining_state_email ON public.mining_state (lower(user_email));
CREATE INDEX IF NOT EXISTS idx_mining_state_user_id ON public.mining_state (user_id);

-- Enable RLS and create open policy for client access
ALTER TABLE public.mining_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all on mining_state" ON public.mining_state;
CREATE POLICY "Allow public all on mining_state" ON public.mining_state FOR ALL USING (true) WITH CHECK (true);

-- Also ensure mining_contracts table has open RLS policies
ALTER TABLE public.mining_contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public all on mining_contracts" ON public.mining_contracts;
CREATE POLICY "Allow public all on mining_contracts" ON public.mining_contracts FOR ALL USING (true) WITH CHECK (true);

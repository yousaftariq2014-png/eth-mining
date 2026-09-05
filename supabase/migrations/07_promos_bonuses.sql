-- Migration 07: Promo Codes & Bonus Injections
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

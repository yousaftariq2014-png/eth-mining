-- Migration 08: VIP Update Leads
CREATE TABLE IF NOT EXISTS public.lead_subscribers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'new',
  created_at TEXT NOT NULL,
  inserted_at TIMESTAMPTZ DEFAULT now()
);

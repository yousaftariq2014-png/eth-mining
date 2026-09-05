-- Migration 09: Global Broadcast Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  target_audience TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT now()
);

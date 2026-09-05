-- Migration 06: KYC Compliance & Identity Verification
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  doc_type TEXT NOT NULL,
  doc_number TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TEXT NOT NULL,
  approved_tier INTEGER DEFAULT 0,
  rejection_reason TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT,
  document_file_name TEXT,
  document_mime_type TEXT,
  document_size_bytes BIGINT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

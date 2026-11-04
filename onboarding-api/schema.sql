-- Properfy onboarding records (Cloudflare D1). Apply with:
--   npx wrangler d1 execute properfy-onboarding --remote --file schema.sql
CREATE TABLE IF NOT EXISTS onboardings (
  id TEXT PRIMARY KEY,                    -- client reference, e.g. PFY-7K2QXD
  token_hash TEXT NOT NULL,               -- SHA-256 of the client's private status token
  created_at TEXT NOT NULL,
  transaction_type TEXT NOT NULL,         -- purchase | sale | remortgage
  transaction_label TEXT NOT NULL,
  amount_pence INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  property_address TEXT NOT NULL,
  property_postcode TEXT NOT NULL,        -- also the bank transfer reference
  agreement_version TEXT NOT NULL,        -- Terms of Business version accepted
  agreement_sha256 TEXT NOT NULL,         -- fingerprint of the exact terms text accepted
  agreement_accepted INTEGER NOT NULL,
  introductions_authorised INTEGER NOT NULL, -- 1 = may share details for other services they ask for
  early_start_requested INTEGER NOT NULL, -- 1 = asked for work to begin in the cancellation period
  cancellation_period_ends TEXT NOT NULL, -- UK date (YYYY-MM-DD)
  services_may_start TEXT NOT NULL,       -- UK date work may begin
  accepted_at TEXT NOT NULL,              -- UTC timestamp the terms were accepted
  client_ip TEXT,
  client_user_agent TEXT,
  pdf_key TEXT NOT NULL,                  -- private R2 object key
  pdf_sha256 TEXT NOT NULL,
  payment_method TEXT NOT NULL,           -- card | bank
  payment_status TEXT NOT NULL,           -- awaiting_card | pending_bank | paid
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  paid_at TEXT,
  paid_confirmed_by TEXT,                 -- stripe | properfy
  agreement_email_status TEXT,            -- pending | sent | failed
  start_reminder_sent_at TEXT,            -- when Properfy was told work may begin
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS onboardings_status ON onboardings (payment_status, created_at);
CREATE INDEX IF NOT EXISTS onboardings_ip ON onboardings (client_ip, created_at);
CREATE INDEX IF NOT EXISTS onboardings_start ON onboardings (early_start_requested, services_may_start);

-- Audit trail of everything that happens to an onboarding.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  onboarding_id TEXT,
  at TEXT NOT NULL,
  type TEXT NOT NULL,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS events_onboarding ON events (onboarding_id, at);

-- Stripe webhook events already handled (so retries are ignored).
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT,
  received_at TEXT NOT NULL
);

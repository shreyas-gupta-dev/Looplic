-- WhatsApp guided-booking flow migration.
--
-- Adds the wizard state the tap-driven booking flow needs on top of the
-- existing whatsapp_conversations table, plus an idempotency ledger so Meta's
-- webhook retries can't replay a tap (which on the confirm step would create a
-- duplicate booking).
--
-- Safe to run more than once. Run against the Looplic RDS database:
--   psql "$DATABASE_URL" -f scripts/migrate-whatsapp-flow.sql

BEGIN;

-- The base tables (from rds-schema.sql) in case the WhatsApp bot migration was
-- never run on this database.
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_id TEXT NOT NULL UNIQUE,
  profile_name TEXT,
  state TEXT NOT NULL DEFAULT 'new',
  last_booking_code TEXT,
  last_inbound_at TIMESTAMPTZ,
  last_outbound_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  message_id TEXT,
  type TEXT NOT NULL DEFAULT 'text',
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wa_id ON whatsapp_messages(wa_id, created_at);

-- ─── Wizard state ────────────────────────────────────────────────────────────
ALTER TABLE whatsapp_conversations
  ADD COLUMN IF NOT EXISTS flow_step TEXT NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS flow_context JSONB,
  ADD COLUMN IF NOT EXISTS flow_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handoff_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opted_out BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── Webhook idempotency ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whatsapp_processed_messages (
  message_id TEXT PRIMARY KEY,
  wa_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_processed_messages_created_at
  ON whatsapp_processed_messages(created_at);

COMMIT;

-- Housekeeping (optional, run periodically): the ledger only needs to cover
-- Meta's retry window, so old rows can be dropped.
--   DELETE FROM whatsapp_processed_messages WHERE created_at < NOW() - INTERVAL '7 days';

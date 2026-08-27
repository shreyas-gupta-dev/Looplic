-- Sequential invoice numbering + invoice email delivery support.
-- Run once against the live RDS database (idempotent — safe to re-run).
--
-- 1. document_counters: one atomic counter per document type per year, so
--    invoice numbers are sequential and human readable (LOOP-INV-2026-0001).
-- 2. service_bills: customer email/address for the invoice "Bill To" block,
--    plus invoice_emailed_at so paid-invoice emails are sent only once.
-- 3. buyback_bookings: receipt_number (LOOP-RCT-2026-0001) + receipt_emailed_at
--    for the payment receipt emailed when a buyback order is marked paid.
-- 4. Replaces the old random invoice-number trigger (INV-YYYYMMDD-XXXXXX) with
--    the sequential generator. Existing rows keep their old numbers (no backfill).

CREATE TABLE IF NOT EXISTS document_counters (
  doc_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_value INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (doc_type, year)
);

-- Atomically increments the counter and returns e.g. LOOP-INV-2026-0042.
-- The ON CONFLICT upsert takes a row lock, so concurrent inserts serialize and
-- can never hand out the same number twice.
CREATE OR REPLACE FUNCTION next_document_number(p_doc_type TEXT, p_prefix TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_year INTEGER := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_next INTEGER;
BEGIN
  INSERT INTO document_counters (doc_type, year, last_value)
  VALUES (p_doc_type, v_year, 1)
  ON CONFLICT (doc_type, year)
  DO UPDATE SET last_value = document_counters.last_value + 1
  RETURNING last_value INTO v_next;
  -- LPAD alone truncates once the counter passes 9999, so grow the width instead.
  RETURN p_prefix || '-' || v_year || '-' || LPAD(v_next::TEXT, GREATEST(4, LENGTH(v_next::TEXT)), '0');
END;
$$;

ALTER TABLE service_bills ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE service_bills ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE service_bills ADD COLUMN IF NOT EXISTS invoice_emailed_at TIMESTAMPTZ;

ALTER TABLE buyback_bookings ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE buyback_bookings ADD COLUMN IF NOT EXISTS receipt_emailed_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_buyback_bookings_receipt_number
  ON buyback_bookings(receipt_number) WHERE receipt_number IS NOT NULL;

-- New bills get sequential numbers from the shared counter.
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := next_document_number('service_invoice', 'LOOP-INV');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_invoice_number ON service_bills;
CREATE TRIGGER trg_generate_invoice_number
BEFORE INSERT ON service_bills
FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

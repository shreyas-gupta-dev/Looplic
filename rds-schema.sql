-- Looplic RDS Schema
-- Run this on a fresh Amazon RDS PostgreSQL 16 database named "looplic"
-- This replaces all Supabase migrations without Supabase-specific RLS/auth references

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'operation', 'technician', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── App Settings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User Roles ──────────────────────────────────────────────────────────────
-- NOTE: user_id stores Cognito sub (UUID string), not a foreign key to auth.users
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- ─── Brands ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  letter TEXT NOT NULL DEFAULT '',
  gradient TEXT NOT NULL DEFAULT 'from-blue-500 to-cyan-500',
  sort_order INT NOT NULL DEFAULT 0,
  image_url TEXT,
  service_type TEXT NOT NULL DEFAULT 'mobile',
  slug TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_service_type ON brands(service_type);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);

-- ─── Series ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_series_brand_id ON series(brand_id);

-- ─── Models ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_models_series_id ON models(series_id);

-- ─── Repair Categories ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repair_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'mobile',
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_categories_service_type ON repair_categories(service_type);

-- ─── Repair Subcategories ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repair_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES repair_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  image_url TEXT,
  price_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_subcategories_category_id ON repair_subcategories(category_id);

-- ─── Model Repair Services ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS model_repair_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  repair_category_id UUID NOT NULL REFERENCES repair_categories(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Model Repair Subcategory Prices ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS model_repair_subcategory_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  repair_subcategory_id UUID NOT NULL REFERENCES repair_subcategories(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (model_id, repair_subcategory_id)
);

-- ─── Screen Guard Categories ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS screen_guard_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Screen Guard Types ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS screen_guard_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES screen_guard_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Model Screen Guards ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS model_screen_guards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  guard_type TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Customer Profiles ────────────────────────────────────────────────────────
-- NOTE: user_id stores Cognito sub (text), not a foreign key
CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id TEXT PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  inspect_latitude NUMERIC,
  inspect_longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Bookings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  guard_type TEXT,
  repair_category_id UUID REFERENCES repair_categories(id) ON DELETE SET NULL,
  repair_subcategory_id UUID REFERENCES repair_subcategories(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL DEFAULT 'mobile_repair',
  status TEXT NOT NULL DEFAULT 'pending',
  location TEXT,
  pincode TEXT,
  scheduled_date TEXT,
  time_slot TEXT,
  notes TEXT,
  user_id TEXT,
  booking_code TEXT,
  manual_order BOOLEAN NOT NULL DEFAULT FALSE,
  order_source TEXT NOT NULL DEFAULT 'website',
  assigned_rider TEXT,
  assignment_notes TEXT,
  assigned_at TIMESTAMPTZ,
  inspect_latitude NUMERIC,
  inspect_longitude NUMERIC,
  cctv_brand TEXT,
  cctv_service TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON bookings(service_type);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_rider ON bookings(assigned_rider);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON bookings(booking_code);

-- Booking code generation function
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  prefix TEXT;
  code TEXT;
BEGIN
  prefix := CASE NEW.service_type
    WHEN 'mobile_repair' THEN 'MOB'
    WHEN 'laptop_repair' THEN 'LAP'
    WHEN 'screen_guard' THEN 'SCG'
    WHEN 'cctv' THEN 'CCT'
    WHEN 'it_support' THEN 'ITS'
    WHEN 'desktop_assembly' THEN 'DSK'
    ELSE 'BKG'
  END;
  code := prefix || '-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTR(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6));
  NEW.booking_code := code;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_booking_code ON bookings;
CREATE TRIGGER trg_generate_booking_code
BEFORE INSERT ON bookings
FOR EACH ROW
WHEN (NEW.booking_code IS NULL OR NEW.booking_code = '')
EXECUTE FUNCTION generate_booking_code();

-- ─── Service Bills ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  service_type TEXT NOT NULL,
  repair_category_id UUID REFERENCES repair_categories(id) ON DELETE SET NULL,
  repair_subcategory_id UUID REFERENCES repair_subcategories(id) ON DELETE SET NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC GENERATED ALWAYS AS (GREATEST(amount - discount + tax, 0)) STORED,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  payment_mode TEXT,
  warranty_duration_value NUMERIC,
  warranty_duration_unit TEXT,
  warranty_label TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_bills_booking_id ON service_bills(booking_id);
CREATE INDEX IF NOT EXISTS idx_service_bills_payment_status ON service_bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_service_bills_created_at ON service_bills(created_at DESC);

-- Invoice number generation
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_invoice_number ON service_bills;
CREATE TRIGGER trg_generate_invoice_number
BEFORE INSERT ON service_bills
FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_service_bills_updated_at ON service_bills;
CREATE TRIGGER trg_service_bills_updated_at
BEFORE UPDATE ON service_bills FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Booking Inspections ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  technician_id TEXT,
  technician_name TEXT,
  device_brand TEXT,
  device_model TEXT,
  reported_issue TEXT,
  repair_category_id UUID REFERENCES repair_categories(id) ON DELETE SET NULL,
  repair_subcategory_id UUID REFERENCES repair_subcategories(id) ON DELETE SET NULL,
  issue_severity TEXT,
  device_condition TEXT,
  accessories_received TEXT,
  customer_approval TEXT NOT NULL DEFAULT 'pending',
  pickup_required BOOLEAN NOT NULL DEFAULT TRUE,
  pickup_notes TEXT,
  quote_amount NUMERIC NOT NULL DEFAULT 0,
  quote_notes TEXT,
  warranty_label TEXT,
  status TEXT NOT NULL DEFAULT 'inspection',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_inspections_booking_id ON booking_inspections(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_inspections_technician_id ON booking_inspections(technician_id);

DROP TRIGGER IF EXISTS trg_booking_inspections_updated_at ON booking_inspections;
CREATE TRIGGER trg_booking_inspections_updated_at
BEFORE UPDATE ON booking_inspections FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Technician Applications ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS technician_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  vehicle_type TEXT,
  experience TEXT,
  service_types TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technician_applications_status ON technician_applications(status);
CREATE INDEX IF NOT EXISTS idx_technician_applications_email ON technician_applications(email);

DROP TRIGGER IF EXISTS trg_technician_applications_updated_at ON technician_applications;
CREATE TRIGGER trg_technician_applications_updated_at
BEFORE UPDATE ON technician_applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Buyback ──────────────────────────────────────────────────────────────────
-- Per-model buyback base price (value of the device in perfect condition).
CREATE TABLE IF NOT EXISTS buyback_model_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL UNIQUE REFERENCES models(id) ON DELETE CASCADE,
  base_price NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyback_model_prices_model_id ON buyback_model_prices(model_id);

DROP TRIGGER IF EXISTS trg_buyback_model_prices_updated_at ON buyback_model_prices;
CREATE TRIGGER trg_buyback_model_prices_updated_at
BEFORE UPDATE ON buyback_model_prices FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Optional per-variant buyback prices (e.g. 64 GB / 128 GB / 256 GB). When a
-- model has active variant rows the customer picks one and its price becomes
-- the quote base; otherwise buyback_model_prices supplies the single price.
CREATE TABLE IF NOT EXISTS buyback_model_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  variant_label TEXT NOT NULL,
  base_price NUMERIC NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(model_id, variant_label)
);

CREATE INDEX IF NOT EXISTS idx_buyback_model_variants_model_id ON buyback_model_variants(model_id);

DROP TRIGGER IF EXISTS trg_buyback_model_variants_updated_at ON buyback_model_variants;
CREATE TRIGGER trg_buyback_model_variants_updated_at
BEFORE UPDATE ON buyback_model_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Customer buyback pickup bookings created by the sell flow's quote screen.
-- status: pending -> confirmed -> picked_up -> paid (or cancelled).
CREATE TABLE IF NOT EXISTS buyback_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL DEFAULT 'mobile',
  brand_name TEXT NOT NULL,
  model_name TEXT NOT NULL,
  variant_label TEXT,
  quoted_amount NUMERIC,
  quote_breakdown TEXT,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  pickup_date TEXT,
  time_slot TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyback_bookings_status ON buyback_bookings(status);
CREATE INDEX IF NOT EXISTS idx_buyback_bookings_created_at ON buyback_bookings(created_at);

DROP TRIGGER IF EXISTS trg_buyback_bookings_updated_at ON buyback_bookings;
CREATE TRIGGER trg_buyback_bookings_updated_at
BEFORE UPDATE ON buyback_bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Universal evaluation questions buyers answer; scoped per service type.
-- os_segment scopes a question to Apple or Android/other devices ('all' = every brand).
CREATE TABLE IF NOT EXISTS buyback_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL DEFAULT 'mobile',
  os_segment TEXT NOT NULL DEFAULT 'all', -- all | apple | android
  title TEXT NOT NULL,
  description TEXT,
  question_type TEXT NOT NULL DEFAULT 'single', -- single | multi
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyback_questions_service_type ON buyback_questions(service_type);

-- Each option adjusts the quote: deduct/add a fixed amount or a percentage.
CREATE TABLE IF NOT EXISTS buyback_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES buyback_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  effect_type TEXT NOT NULL DEFAULT 'deduct_fixed', -- deduct_fixed | deduct_percent | add_fixed | add_percent
  amount NUMERIC NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyback_question_options_question_id ON buyback_question_options(question_id);

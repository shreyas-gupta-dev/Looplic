-- Migration: Add Data Recovery service type to booking code generator and seed default config
-- Date: 2026-11-14
-- Non-destructive: Updates the trigger function and seeds app_settings if not present.

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
    WHEN 'data_recovery' THEN 'REC'
    ELSE 'BKG'
  END;
  code := prefix || '-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTR(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 6));
  NEW.booking_code := code;
  RETURN NEW;
END;
$$;

-- Seed default data_recovery_config in app_settings if not exists
INSERT INTO app_settings (key, value, created_at, updated_at)
VALUES (
  'data_recovery_config',
  '{"pricing":{"evaluation_fee":0,"hdd_base_price":2499,"ssd_base_price":3499,"raid_base_price":8499},"turnaround":{"standard_days":"3-5 business days","priority_days":"24-48 hours","emergency_hours":"Same day / 24 hours"},"emergency_phone":"+91 88844 45924","whatsapp_number":"918884445924","active_notice":""}',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO NOTHING;

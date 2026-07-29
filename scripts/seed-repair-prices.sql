-- ============================================================================
-- Looplic — ROUGH repair price seed (uniform per repair type)
-- ============================================================================
-- These are ROUGH market-average estimates (Indian mobile repair market), NOT
-- real Cashify data and NOT model-specific. They are a starting point so the
-- repair flow (website + WhatsApp bot) can show a price. REVIEW & CORRECT these
-- in the admin panel before relying on them — especially premium models
-- (iPhone / flagship screens cost far more than these uniform values).
--
-- Structure: one price per repair TYPE, applied to ALL mobile models. Diagnostic
-- / consultation / "unknown issue" rows are left at 0 (treated as free /
-- price-on-inspection; the bot only quotes types with price > 0).
--
-- Scope: mobile repair subcategories only (laptop has no subcategories yet).
--
-- ── HOW TO RUN ──────────────────────────────────────────────────────────────
-- STEP 1 (this UPDATE): seeds the prices. Safe — nothing is shown to customers
--   yet because price visibility is still OFF. You can review every price in the
--   admin Repair panel afterwards.
-- STEP 2 (the very bottom, commented out): flips visibility ON so prices appear
--   on the live website + WhatsApp bot. Run STEP 2 ONLY when you're happy with
--   the numbers in admin.
-- ============================================================================

BEGIN;

UPDATE repair_subcategories AS s
SET price = v.price
FROM (
  VALUES
    -- Display / screen
    ('Screen Replacement', 2499),
    ('OLED Display Replacement', 3499),
    ('LCD Replacement', 2299),
    ('Glass Replacement', 1499),
    ('Touch Not Working', 2299),
    ('Black Screen', 2299),
    ('Dead Pixels', 2299),
    ('Green Line Issue', 2499),
    ('Display Flickering', 1999),
    ('Screen Coming Off', 899),
    -- Body / frame
    ('Back Glass Replacement', 1499),
    ('Back Panel Replacement', 1299),
    ('Frame Replacement', 1999),
    ('Housing Replacement', 1999),
    ('Button Frame Repair', 999),
    -- Battery / charging
    ('Battery Replacement', 1299),
    ('Battery Draining Fast', 1299),
    ('Battery Percentage Jumping', 1299),
    ('Battery Swollen', 1499),
    ('Slow Charging', 899),
    ('Fast Charging Not Working', 999),
    ('Wireless Charging Repair', 1499),
    ('Charging Port Replacement', 999),
    ('Charging Port Cleaning', 499),
    ('Phone Not Charging', 999),
    ('No Power Issue', 1499),
    ('USB Port Repair', 999),
    -- Camera
    ('Front Camera Replacement', 1199),
    ('Rear Camera Replacement', 1499),
    ('Camera Lens Replacement', 899),
    ('Camera Glass Replacement', 799),
    ('Camera Not Opening', 1199),
    ('Blurry Camera Fix', 999),
    ('Flash Not Working', 899),
    ('Focus Issue', 999),
    -- Audio
    ('Loud Speaker Repair', 799),
    ('Earpiece Speaker Repair', 799),
    ('Speaker Cleaning', 399),
    ('Microphone Repair', 799),
    ('No Sound', 799),
    ('Distorted Sound', 799),
    ('Low Volume Issue', 699),
    -- Buttons / sensors
    ('Power Button Repair', 699),
    ('Volume Button Repair', 699),
    ('Side Button Repair', 699),
    ('Home Button Repair', 999),
    ('Fingerprint Sensor Repair', 1199),
    ('Fingerprint Button Repair', 1199),
    ('Face ID Repair', 2499),
    ('Proximity Sensor Repair', 899),
    ('Light Sensor Repair', 899),
    ('Gyroscope Repair', 999),
    ('Compass Repair', 899),
    ('GPS Repair', 999),
    -- Connectivity
    ('Wi-Fi Repair', 1299),
    ('Bluetooth Repair', 1299),
    ('NFC Repair', 1299),
    ('Network Signal Issue', 1499),
    ('SIM Detection Issue', 999),
    ('SIM Tray Replacement', 399),
    -- Motherboard / IC
    ('Motherboard Repair', 2999),
    ('CPU Repair', 3499),
    ('IC Replacement', 2499),
    ('Memory IC Repair', 2499),
    ('Short Circuit Repair', 1999),
    ('Boot Loop Fix', 1499),
    -- Water / liquid damage
    ('Water Damage Repair', 1999),
    ('Water Damage Cleaning', 1299),
    ('Liquid Damage Repair', 1999),
    ('Corrosion Removal', 1499),
    ('Motherboard Drying', 1499),
    -- Software
    ('OS Reinstallation', 599),
    ('Software Update', 399),
    ('Virus Removal', 599),
    ('Performance Optimization', 599),
    ('Phone Hanging', 599),
    ('FRP Unlock', 999),
    ('Password Unlock', 799),
    -- Data
    ('Data Recovery', 1999),
    ('Data Backup', 499)
) AS v(name, price)
WHERE s.name = v.name
  AND s.category_id IN (SELECT id FROM repair_categories WHERE service_type = 'mobile');

-- The remaining diagnostic / catch-all types are intentionally left at price 0
-- (free / price-on-inspection; excluded from bot quotes):
--   Battery Health Check, Consultation, Device Inspection, General Inspection,
--   Hardware Diagnosis, Software Diagnosis, Repair Estimate, Custom Repair Request,
--   Multiple Issues, Unknown Issue.

-- Sanity check: how many mobile subcategories now have a price > 0.
-- SELECT count(*) FILTER (WHERE price > 0) AS priced,
--        count(*) AS total
-- FROM repair_subcategories s
-- JOIN repair_categories c ON c.id = s.category_id
-- WHERE c.service_type = 'mobile';

COMMIT;

-- ============================================================================
-- STEP 2 — GO LIVE (run separately, only after reviewing prices in admin).
-- This flips the global visibility flag so repair prices show on the website
-- and the WhatsApp bot. To hide them again, set 'visible' back to false.
-- ============================================================================
-- INSERT INTO app_settings (key, value)
-- VALUES ('repair_subcategory_prices', '{"visible": true}'::jsonb)
-- ON CONFLICT (key) DO UPDATE
--   SET value = jsonb_set(COALESCE(app_settings.value, '{}'::jsonb), '{visible}', 'true'::jsonb),
--       updated_at = NOW();

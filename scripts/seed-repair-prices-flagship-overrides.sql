-- ============================================================================
-- Looplic — FLAGSHIP per-model repair price overrides (rough estimates)
-- ============================================================================
-- Overrides the uniform seed (scripts/seed-repair-prices.sql) for the top ~20
-- popular flagship models, where a single uniform price badly underprices the
-- device (e.g. an iPhone/Galaxy Ultra screen costs far more than the ~2,499
-- uniform value). Writes into model_repair_subcategory_prices, which takes
-- precedence over the base subcategory price for that specific model.
--
-- These are ROUGH benchmarked estimates of the Indian third-party repair market,
-- NOT real Cashify data and NOT your final prices. REVIEW & CORRECT in admin.
-- Per model: Screen Replacement + OLED Display Replacement (= screen price),
-- Battery Replacement, Back Glass Replacement.
--
-- Run AFTER seed-repair-prices.sql. Idempotent (ON CONFLICT upsert) — safe to
-- re-run. Model + subcategory IDs were resolved from the live catalog.
-- ============================================================================

BEGIN;

INSERT INTO model_repair_subcategory_prices (model_id, repair_subcategory_id, price) VALUES
  ('a38f8896-961c-4d57-975f-fad9ca80068f', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 3999),   -- Apple iPhone 11: Screen
  ('a38f8896-961c-4d57-975f-fad9ca80068f', '36184616-159e-439e-ad4a-14ee9a18f3ba', 3999),   -- Apple iPhone 11: OLED Display
  ('a38f8896-961c-4d57-975f-fad9ca80068f', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2499),   -- Apple iPhone 11: Battery
  ('a38f8896-961c-4d57-975f-fad9ca80068f', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1999),   -- Apple iPhone 11: Back Glass
  ('8c2656dd-e565-4480-a56a-cec1576eb0e7', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 6499),   -- Apple iPhone 12: Screen
  ('8c2656dd-e565-4480-a56a-cec1576eb0e7', '36184616-159e-439e-ad4a-14ee9a18f3ba', 6499),   -- Apple iPhone 12: OLED Display
  ('8c2656dd-e565-4480-a56a-cec1576eb0e7', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2999),   -- Apple iPhone 12: Battery
  ('8c2656dd-e565-4480-a56a-cec1576eb0e7', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2499),   -- Apple iPhone 12: Back Glass
  ('2fa5d82f-1c3f-4488-b49c-c3e634c60bd3', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 7499),   -- Apple iPhone 13: Screen
  ('2fa5d82f-1c3f-4488-b49c-c3e634c60bd3', '36184616-159e-439e-ad4a-14ee9a18f3ba', 7499),   -- Apple iPhone 13: OLED Display
  ('2fa5d82f-1c3f-4488-b49c-c3e634c60bd3', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 3299),   -- Apple iPhone 13: Battery
  ('2fa5d82f-1c3f-4488-b49c-c3e634c60bd3', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2499),   -- Apple iPhone 13: Back Glass
  ('13246998-ddd9-405b-b7e5-9117c116d8dd', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 8499),   -- Apple iPhone 14: Screen
  ('13246998-ddd9-405b-b7e5-9117c116d8dd', '36184616-159e-439e-ad4a-14ee9a18f3ba', 8499),   -- Apple iPhone 14: OLED Display
  ('13246998-ddd9-405b-b7e5-9117c116d8dd', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 3499),   -- Apple iPhone 14: Battery
  ('13246998-ddd9-405b-b7e5-9117c116d8dd', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2999),   -- Apple iPhone 14: Back Glass
  ('4aad1dee-bd45-4251-b5b8-e4866edc27a8', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 9499),   -- Apple iPhone 15: Screen
  ('4aad1dee-bd45-4251-b5b8-e4866edc27a8', '36184616-159e-439e-ad4a-14ee9a18f3ba', 9499),   -- Apple iPhone 15: OLED Display
  ('4aad1dee-bd45-4251-b5b8-e4866edc27a8', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 3999),   -- Apple iPhone 15: Battery
  ('4aad1dee-bd45-4251-b5b8-e4866edc27a8', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2999),   -- Apple iPhone 15: Back Glass
  ('a03a1c51-284c-4db4-896c-3d3ed29cb790', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 7499),   -- Apple iPhone 12 Pro: Screen
  ('a03a1c51-284c-4db4-896c-3d3ed29cb790', '36184616-159e-439e-ad4a-14ee9a18f3ba', 7499),   -- Apple iPhone 12 Pro: OLED Display
  ('a03a1c51-284c-4db4-896c-3d3ed29cb790', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 3299),   -- Apple iPhone 12 Pro: Battery
  ('a03a1c51-284c-4db4-896c-3d3ed29cb790', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2999),   -- Apple iPhone 12 Pro: Back Glass
  ('bd9f5b40-b2d7-4533-b0e9-535f77da1a34', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 8999),   -- Apple iPhone 13 Pro: Screen
  ('bd9f5b40-b2d7-4533-b0e9-535f77da1a34', '36184616-159e-439e-ad4a-14ee9a18f3ba', 8999),   -- Apple iPhone 13 Pro: OLED Display
  ('bd9f5b40-b2d7-4533-b0e9-535f77da1a34', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 3499),   -- Apple iPhone 13 Pro: Battery
  ('bd9f5b40-b2d7-4533-b0e9-535f77da1a34', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2999),   -- Apple iPhone 13 Pro: Back Glass
  ('1d7aefa3-c401-4f67-b429-155d2a6e91c4', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 10999),   -- Apple iPhone 14 Pro: Screen
  ('1d7aefa3-c401-4f67-b429-155d2a6e91c4', '36184616-159e-439e-ad4a-14ee9a18f3ba', 10999),   -- Apple iPhone 14 Pro: OLED Display
  ('1d7aefa3-c401-4f67-b429-155d2a6e91c4', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 3999),   -- Apple iPhone 14 Pro: Battery
  ('1d7aefa3-c401-4f67-b429-155d2a6e91c4', '92492e9a-5dbf-4c09-938f-c187efa0a044', 3499),   -- Apple iPhone 14 Pro: Back Glass
  ('a63b7e3d-0f6b-4e27-8630-d4fb81d02c62', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 12999),   -- Apple iPhone 15 Pro Max: Screen
  ('a63b7e3d-0f6b-4e27-8630-d4fb81d02c62', '36184616-159e-439e-ad4a-14ee9a18f3ba', 12999),   -- Apple iPhone 15 Pro Max: OLED Display
  ('a63b7e3d-0f6b-4e27-8630-d4fb81d02c62', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 4499),   -- Apple iPhone 15 Pro Max: Battery
  ('a63b7e3d-0f6b-4e27-8630-d4fb81d02c62', '92492e9a-5dbf-4c09-938f-c187efa0a044', 3999),   -- Apple iPhone 15 Pro Max: Back Glass
  ('89b1c8e8-fbf5-4ff1-94f3-78742b146a16', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 14999),   -- Apple iPhone 16 Pro Max: Screen
  ('89b1c8e8-fbf5-4ff1-94f3-78742b146a16', '36184616-159e-439e-ad4a-14ee9a18f3ba', 14999),   -- Apple iPhone 16 Pro Max: OLED Display
  ('89b1c8e8-fbf5-4ff1-94f3-78742b146a16', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 4999),   -- Apple iPhone 16 Pro Max: Battery
  ('89b1c8e8-fbf5-4ff1-94f3-78742b146a16', '92492e9a-5dbf-4c09-938f-c187efa0a044', 4499),   -- Apple iPhone 16 Pro Max: Back Glass
  ('49879d0b-4fc6-4cc2-ae1c-581d74ab4312', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 6499),   -- Samsung Galaxy S21 5G: Screen
  ('49879d0b-4fc6-4cc2-ae1c-581d74ab4312', '36184616-159e-439e-ad4a-14ee9a18f3ba', 6499),   -- Samsung Galaxy S21 5G: OLED Display
  ('49879d0b-4fc6-4cc2-ae1c-581d74ab4312', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2499),   -- Samsung Galaxy S21 5G: Battery
  ('49879d0b-4fc6-4cc2-ae1c-581d74ab4312', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2499),   -- Samsung Galaxy S21 5G: Back Glass
  ('620d4773-b2d2-429d-9aa5-d6ff2151f258', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 7499),   -- Samsung Galaxy S22 5G: Screen
  ('620d4773-b2d2-429d-9aa5-d6ff2151f258', '36184616-159e-439e-ad4a-14ee9a18f3ba', 7499),   -- Samsung Galaxy S22 5G: OLED Display
  ('620d4773-b2d2-429d-9aa5-d6ff2151f258', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2699),   -- Samsung Galaxy S22 5G: Battery
  ('620d4773-b2d2-429d-9aa5-d6ff2151f258', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2699),   -- Samsung Galaxy S22 5G: Back Glass
  ('5378d234-52f6-4e0a-9a3a-14b60652731a', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 8499),   -- Samsung Galaxy S23 5G: Screen
  ('5378d234-52f6-4e0a-9a3a-14b60652731a', '36184616-159e-439e-ad4a-14ee9a18f3ba', 8499),   -- Samsung Galaxy S23 5G: OLED Display
  ('5378d234-52f6-4e0a-9a3a-14b60652731a', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2999),   -- Samsung Galaxy S23 5G: Battery
  ('5378d234-52f6-4e0a-9a3a-14b60652731a', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2699),   -- Samsung Galaxy S23 5G: Back Glass
  ('464f2033-377e-49d6-9f41-fb7b6aeba76b', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 12999),   -- Samsung Galaxy S23 Ultra: Screen
  ('464f2033-377e-49d6-9f41-fb7b6aeba76b', '36184616-159e-439e-ad4a-14ee9a18f3ba', 12999),   -- Samsung Galaxy S23 Ultra: OLED Display
  ('464f2033-377e-49d6-9f41-fb7b6aeba76b', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 3499),   -- Samsung Galaxy S23 Ultra: Battery
  ('464f2033-377e-49d6-9f41-fb7b6aeba76b', '92492e9a-5dbf-4c09-938f-c187efa0a044', 3499),   -- Samsung Galaxy S23 Ultra: Back Glass
  ('1a46f8b4-6594-4b17-b5b9-0b72f905178e', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 14999),   -- Samsung Galaxy S24 Ultra: Screen
  ('1a46f8b4-6594-4b17-b5b9-0b72f905178e', '36184616-159e-439e-ad4a-14ee9a18f3ba', 14999),   -- Samsung Galaxy S24 Ultra: OLED Display
  ('1a46f8b4-6594-4b17-b5b9-0b72f905178e', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 3999),   -- Samsung Galaxy S24 Ultra: Battery
  ('1a46f8b4-6594-4b17-b5b9-0b72f905178e', '92492e9a-5dbf-4c09-938f-c187efa0a044', 3999),   -- Samsung Galaxy S24 Ultra: Back Glass
  ('71a3c2bd-2abe-4342-9769-3850965b504f', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 5499),   -- OnePlus 9: Screen
  ('71a3c2bd-2abe-4342-9769-3850965b504f', '36184616-159e-439e-ad4a-14ee9a18f3ba', 5499),   -- OnePlus 9: OLED Display
  ('71a3c2bd-2abe-4342-9769-3850965b504f', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2299),   -- OnePlus 9: Battery
  ('71a3c2bd-2abe-4342-9769-3850965b504f', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1999),   -- OnePlus 9: Back Glass
  ('d9d4474a-d421-4cf7-85f0-11c7d8622cee', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 7499),   -- OnePlus 11: Screen
  ('d9d4474a-d421-4cf7-85f0-11c7d8622cee', '36184616-159e-439e-ad4a-14ee9a18f3ba', 7499),   -- OnePlus 11: OLED Display
  ('d9d4474a-d421-4cf7-85f0-11c7d8622cee', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2699),   -- OnePlus 11: Battery
  ('d9d4474a-d421-4cf7-85f0-11c7d8622cee', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2299),   -- OnePlus 11: Back Glass
  ('e3366182-1097-4e0d-a07a-f86f4797f15b', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 8499),   -- OnePlus 12: Screen
  ('e3366182-1097-4e0d-a07a-f86f4797f15b', '36184616-159e-439e-ad4a-14ee9a18f3ba', 8499),   -- OnePlus 12: OLED Display
  ('e3366182-1097-4e0d-a07a-f86f4797f15b', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2999),   -- OnePlus 12: Battery
  ('e3366182-1097-4e0d-a07a-f86f4797f15b', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2499),   -- OnePlus 12: Back Glass
  ('fd62ae4a-6cdd-4034-b1ed-39fb47b96dde', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 6499),   -- Google Pixel 7: Screen
  ('fd62ae4a-6cdd-4034-b1ed-39fb47b96dde', '36184616-159e-439e-ad4a-14ee9a18f3ba', 6499),   -- Google Pixel 7: OLED Display
  ('fd62ae4a-6cdd-4034-b1ed-39fb47b96dde', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2499),   -- Google Pixel 7: Battery
  ('fd62ae4a-6cdd-4034-b1ed-39fb47b96dde', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2299),   -- Google Pixel 7: Back Glass
  ('883e0c4e-08b9-4b4b-8c31-347a06a4d597', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 7999),   -- Google Pixel 8: Screen
  ('883e0c4e-08b9-4b4b-8c31-347a06a4d597', '36184616-159e-439e-ad4a-14ee9a18f3ba', 7999),   -- Google Pixel 8: OLED Display
  ('883e0c4e-08b9-4b4b-8c31-347a06a4d597', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2999),   -- Google Pixel 8: Battery
  ('883e0c4e-08b9-4b4b-8c31-347a06a4d597', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2499)    -- Google Pixel 8: Back Glass
ON CONFLICT (model_id, repair_subcategory_id)
DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

COMMIT;

-- Verify (should be 80 rows = 20 models x 4 types):
-- SELECT count(*) FROM model_repair_subcategory_prices;

-- ============================================================================
-- Looplic — MID-RANGE per-model repair price overrides (rough estimates)
-- ============================================================================
-- Same idea as the flagship overrides, for 28 popular mid-range / budget models
-- (Redmi/Xiaomi/Poco, Realme, Vivo, Oppo, Samsung A/M, iQOO, Motorola). For most
-- of these the uniform seed (~2,499 screen) is TOO HIGH, so these mostly correct
-- prices DOWN to realistic levels. Per model: Screen + OLED Display (= screen),
-- Battery, Back Glass. ROUGH benchmarked estimates, NOT real Cashify data —
-- REVIEW & CORRECT in admin.
--
-- Run AFTER seed-repair-prices.sql (and alongside the flagship overrides), still
-- before the STEP-2 visibility flip. Idempotent (ON CONFLICT upsert).
-- ============================================================================

BEGIN;

INSERT INTO model_repair_subcategory_prices (model_id, repair_subcategory_id, price) VALUES
  ('7e4d4e56-09be-473c-8623-997ed6d75eb4', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2999),   -- Xiaomi Redmi Note 13 Pro Plus 5G: Screen
  ('7e4d4e56-09be-473c-8623-997ed6d75eb4', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2999),   -- Xiaomi Redmi Note 13 Pro Plus 5G: OLED Display
  ('7e4d4e56-09be-473c-8623-997ed6d75eb4', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1799),   -- Xiaomi Redmi Note 13 Pro Plus 5G: Battery
  ('7e4d4e56-09be-473c-8623-997ed6d75eb4', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1499),   -- Xiaomi Redmi Note 13 Pro Plus 5G: Back Glass
  ('e015015c-cd2f-48ec-a7e5-98a094c77db3', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 1999),   -- Xiaomi Redmi Note 12: Screen
  ('e015015c-cd2f-48ec-a7e5-98a094c77db3', '36184616-159e-439e-ad4a-14ee9a18f3ba', 1999),   -- Xiaomi Redmi Note 12: OLED Display
  ('e015015c-cd2f-48ec-a7e5-98a094c77db3', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1499),   -- Xiaomi Redmi Note 12: Battery
  ('e015015c-cd2f-48ec-a7e5-98a094c77db3', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1199),   -- Xiaomi Redmi Note 12: Back Glass
  ('4f37fc2c-2ba4-4583-adcd-5d738680d8bd', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 1799),   -- Xiaomi Redmi Note 11: Screen
  ('4f37fc2c-2ba4-4583-adcd-5d738680d8bd', '36184616-159e-439e-ad4a-14ee9a18f3ba', 1799),   -- Xiaomi Redmi Note 11: OLED Display
  ('4f37fc2c-2ba4-4583-adcd-5d738680d8bd', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1399),   -- Xiaomi Redmi Note 11: Battery
  ('4f37fc2c-2ba4-4583-adcd-5d738680d8bd', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1199),   -- Xiaomi Redmi Note 11: Back Glass
  ('4e3177ec-9664-43b2-b37a-ad2a65e9697e', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 1799),   -- Xiaomi Redmi Note 10: Screen
  ('4e3177ec-9664-43b2-b37a-ad2a65e9697e', '36184616-159e-439e-ad4a-14ee9a18f3ba', 1799),   -- Xiaomi Redmi Note 10: OLED Display
  ('4e3177ec-9664-43b2-b37a-ad2a65e9697e', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1399),   -- Xiaomi Redmi Note 10: Battery
  ('4e3177ec-9664-43b2-b37a-ad2a65e9697e', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1199),   -- Xiaomi Redmi Note 10: Back Glass
  ('4f47c8d9-e53c-4bc3-8519-2321ebf35d16', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 1499),   -- Xiaomi Redmi 12: Screen
  ('4f47c8d9-e53c-4bc3-8519-2321ebf35d16', '36184616-159e-439e-ad4a-14ee9a18f3ba', 1499),   -- Xiaomi Redmi 12: OLED Display
  ('4f47c8d9-e53c-4bc3-8519-2321ebf35d16', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1299),   -- Xiaomi Redmi 12: Battery
  ('4f47c8d9-e53c-4bc3-8519-2321ebf35d16', '92492e9a-5dbf-4c09-938f-c187efa0a044', 999),   -- Xiaomi Redmi 12: Back Glass
  ('0e790157-0a18-45c5-ac6c-0af19c703747', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 5999),   -- Xiaomi 13 Pro 5G: Screen
  ('0e790157-0a18-45c5-ac6c-0af19c703747', '36184616-159e-439e-ad4a-14ee9a18f3ba', 5999),   -- Xiaomi 13 Pro 5G: OLED Display
  ('0e790157-0a18-45c5-ac6c-0af19c703747', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 2499),   -- Xiaomi 13 Pro 5G: Battery
  ('0e790157-0a18-45c5-ac6c-0af19c703747', '92492e9a-5dbf-4c09-938f-c187efa0a044', 2499),   -- Xiaomi 13 Pro 5G: Back Glass
  ('66c3bc26-5b9d-42a7-a43b-dbb6b41c0a16', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2299),   -- POCO X5: Screen
  ('66c3bc26-5b9d-42a7-a43b-dbb6b41c0a16', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2299),   -- POCO X5: OLED Display
  ('66c3bc26-5b9d-42a7-a43b-dbb6b41c0a16', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1499),   -- POCO X5: Battery
  ('66c3bc26-5b9d-42a7-a43b-dbb6b41c0a16', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1199),   -- POCO X5: Back Glass
  ('976adde3-55b0-485f-8d1b-23cc29ba306c', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 1799),   -- POCO M6 Pro 5G: Screen
  ('976adde3-55b0-485f-8d1b-23cc29ba306c', '36184616-159e-439e-ad4a-14ee9a18f3ba', 1799),   -- POCO M6 Pro 5G: OLED Display
  ('976adde3-55b0-485f-8d1b-23cc29ba306c', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1399),   -- POCO M6 Pro 5G: Battery
  ('976adde3-55b0-485f-8d1b-23cc29ba306c', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1199),   -- POCO M6 Pro 5G: Back Glass
  ('ccdcc500-29bd-4849-a2fc-d17acd5bf058', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2999),   -- Realme 12 Pro 5G: Screen
  ('ccdcc500-29bd-4849-a2fc-d17acd5bf058', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2999),   -- Realme 12 Pro 5G: OLED Display
  ('ccdcc500-29bd-4849-a2fc-d17acd5bf058', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1799),   -- Realme 12 Pro 5G: Battery
  ('ccdcc500-29bd-4849-a2fc-d17acd5bf058', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1499),   -- Realme 12 Pro 5G: Back Glass
  ('0ade1df1-dd5c-4f3d-b263-9945d5ad5753', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2299),   -- Realme 11 5G: Screen
  ('0ade1df1-dd5c-4f3d-b263-9945d5ad5753', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2299),   -- Realme 11 5G: OLED Display
  ('0ade1df1-dd5c-4f3d-b263-9945d5ad5753', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1599),   -- Realme 11 5G: Battery
  ('0ade1df1-dd5c-4f3d-b263-9945d5ad5753', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1299),   -- Realme 11 5G: Back Glass
  ('fbedc115-43ce-4750-9291-4db1fbd6bba9', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 1999),   -- Realme 10: Screen
  ('fbedc115-43ce-4750-9291-4db1fbd6bba9', '36184616-159e-439e-ad4a-14ee9a18f3ba', 1999),   -- Realme 10: OLED Display
  ('fbedc115-43ce-4750-9291-4db1fbd6bba9', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1399),   -- Realme 10: Battery
  ('fbedc115-43ce-4750-9291-4db1fbd6bba9', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1199),   -- Realme 10: Back Glass
  ('6dd36e00-5d73-4fb8-b71b-1df480e293ae', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2199),   -- Realme Narzo 60 5G: Screen
  ('6dd36e00-5d73-4fb8-b71b-1df480e293ae', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2199),   -- Realme Narzo 60 5G: OLED Display
  ('6dd36e00-5d73-4fb8-b71b-1df480e293ae', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1499),   -- Realme Narzo 60 5G: Battery
  ('6dd36e00-5d73-4fb8-b71b-1df480e293ae', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1199),   -- Realme Narzo 60 5G: Back Glass
  ('196f880c-f3bd-4b7b-ad60-50dde917e9d1', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 1499),   -- Realme C55: Screen
  ('196f880c-f3bd-4b7b-ad60-50dde917e9d1', '36184616-159e-439e-ad4a-14ee9a18f3ba', 1499),   -- Realme C55: OLED Display
  ('196f880c-f3bd-4b7b-ad60-50dde917e9d1', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1299),   -- Realme C55: Battery
  ('196f880c-f3bd-4b7b-ad60-50dde917e9d1', '92492e9a-5dbf-4c09-938f-c187efa0a044', 999),   -- Realme C55: Back Glass
  ('13d87e28-9393-453e-9f2b-4bd5412eaee0', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2999),   -- Vivo V29: Screen
  ('13d87e28-9393-453e-9f2b-4bd5412eaee0', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2999),   -- Vivo V29: OLED Display
  ('13d87e28-9393-453e-9f2b-4bd5412eaee0', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1799),   -- Vivo V29: Battery
  ('13d87e28-9393-453e-9f2b-4bd5412eaee0', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1499),   -- Vivo V29: Back Glass
  ('ab87ecd0-07f4-49ec-9404-4fe86b55c9dc', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2299),   -- Vivo T2 5G: Screen
  ('ab87ecd0-07f4-49ec-9404-4fe86b55c9dc', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2299),   -- Vivo T2 5G: OLED Display
  ('ab87ecd0-07f4-49ec-9404-4fe86b55c9dc', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1499),   -- Vivo T2 5G: Battery
  ('ab87ecd0-07f4-49ec-9404-4fe86b55c9dc', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1299),   -- Vivo T2 5G: Back Glass
  ('8355ccf4-a6d9-4786-8490-943a6ef3ab29', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2299),   -- Vivo Y100 5G: Screen
  ('8355ccf4-a6d9-4786-8490-943a6ef3ab29', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2299),   -- Vivo Y100 5G: OLED Display
  ('8355ccf4-a6d9-4786-8490-943a6ef3ab29', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1499),   -- Vivo Y100 5G: Battery
  ('8355ccf4-a6d9-4786-8490-943a6ef3ab29', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1299),   -- Vivo Y100 5G: Back Glass
  ('df8f85b8-2c9b-4e26-9bc4-29d1b2d6ad0d', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 1699),   -- Vivo Y28 5G: Screen
  ('df8f85b8-2c9b-4e26-9bc4-29d1b2d6ad0d', '36184616-159e-439e-ad4a-14ee9a18f3ba', 1699),   -- Vivo Y28 5G: OLED Display
  ('df8f85b8-2c9b-4e26-9bc4-29d1b2d6ad0d', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1399),   -- Vivo Y28 5G: Battery
  ('df8f85b8-2c9b-4e26-9bc4-29d1b2d6ad0d', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1099),   -- Vivo Y28 5G: Back Glass
  ('3761d51c-7080-41f1-b2c8-624514c86f1f', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2999),   -- OPPO Reno 8 5G: Screen
  ('3761d51c-7080-41f1-b2c8-624514c86f1f', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2999),   -- OPPO Reno 8 5G: OLED Display
  ('3761d51c-7080-41f1-b2c8-624514c86f1f', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1799),   -- OPPO Reno 8 5G: Battery
  ('3761d51c-7080-41f1-b2c8-624514c86f1f', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1499),   -- OPPO Reno 8 5G: Back Glass
  ('3f86283b-ba55-43e2-a770-2caea66a8c9f', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 1999),   -- OPPO A78: Screen
  ('3f86283b-ba55-43e2-a770-2caea66a8c9f', '36184616-159e-439e-ad4a-14ee9a18f3ba', 1999),   -- OPPO A78: OLED Display
  ('3f86283b-ba55-43e2-a770-2caea66a8c9f', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1499),   -- OPPO A78: Battery
  ('3f86283b-ba55-43e2-a770-2caea66a8c9f', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1199),   -- OPPO A78: Back Glass
  ('00dc63e5-4f37-465a-9709-429909fdde94', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2299),   -- OPPO F23 5G: Screen
  ('00dc63e5-4f37-465a-9709-429909fdde94', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2299),   -- OPPO F23 5G: OLED Display
  ('00dc63e5-4f37-465a-9709-429909fdde94', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1599),   -- OPPO F23 5G: Battery
  ('00dc63e5-4f37-465a-9709-429909fdde94', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1299),   -- OPPO F23 5G: Back Glass
  ('4d47b198-1996-425d-9929-dc5477b8eae0', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2999),   -- Samsung Galaxy A54 5G: Screen
  ('4d47b198-1996-425d-9929-dc5477b8eae0', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2999),   -- Samsung Galaxy A54 5G: OLED Display
  ('4d47b198-1996-425d-9929-dc5477b8eae0', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1799),   -- Samsung Galaxy A54 5G: Battery
  ('4d47b198-1996-425d-9929-dc5477b8eae0', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1499),   -- Samsung Galaxy A54 5G: Back Glass
  ('4083bfe6-bec6-4ccc-a453-aaa462510bcc', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2699),   -- Samsung Galaxy A34 5G: Screen
  ('4083bfe6-bec6-4ccc-a453-aaa462510bcc', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2699),   -- Samsung Galaxy A34 5G: OLED Display
  ('4083bfe6-bec6-4ccc-a453-aaa462510bcc', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1699),   -- Samsung Galaxy A34 5G: Battery
  ('4083bfe6-bec6-4ccc-a453-aaa462510bcc', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1399),   -- Samsung Galaxy A34 5G: Back Glass
  ('6b94f9a0-a299-4b7e-be5e-faa10b069f5f', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 1799),   -- Samsung Galaxy A14 5G: Screen
  ('6b94f9a0-a299-4b7e-be5e-faa10b069f5f', '36184616-159e-439e-ad4a-14ee9a18f3ba', 1799),   -- Samsung Galaxy A14 5G: OLED Display
  ('6b94f9a0-a299-4b7e-be5e-faa10b069f5f', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1399),   -- Samsung Galaxy A14 5G: Battery
  ('6b94f9a0-a299-4b7e-be5e-faa10b069f5f', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1199),   -- Samsung Galaxy A14 5G: Back Glass
  ('345c36c1-2715-4275-97be-485be04f76d2', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2299),   -- Samsung Galaxy M34 5G: Screen
  ('345c36c1-2715-4275-97be-485be04f76d2', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2299),   -- Samsung Galaxy M34 5G: OLED Display
  ('345c36c1-2715-4275-97be-485be04f76d2', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1599),   -- Samsung Galaxy M34 5G: Battery
  ('345c36c1-2715-4275-97be-485be04f76d2', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1299),   -- Samsung Galaxy M34 5G: Back Glass
  ('e2b34f52-c552-4e22-a2fe-2f8e64db7caa', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2199),   -- iQOO Z7 5G: Screen
  ('e2b34f52-c552-4e22-a2fe-2f8e64db7caa', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2199),   -- iQOO Z7 5G: OLED Display
  ('e2b34f52-c552-4e22-a2fe-2f8e64db7caa', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1499),   -- iQOO Z7 5G: Battery
  ('e2b34f52-c552-4e22-a2fe-2f8e64db7caa', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1199),   -- iQOO Z7 5G: Back Glass
  ('4eb7b846-7fd4-48ae-a0de-408071d450ba', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2699),   -- iQOO Neo 7 5G: Screen
  ('4eb7b846-7fd4-48ae-a0de-408071d450ba', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2699),   -- iQOO Neo 7 5G: OLED Display
  ('4eb7b846-7fd4-48ae-a0de-408071d450ba', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1699),   -- iQOO Neo 7 5G: Battery
  ('4eb7b846-7fd4-48ae-a0de-408071d450ba', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1399),   -- iQOO Neo 7 5G: Back Glass
  ('d46c54a3-9787-47f1-90b2-06e00d043dd9', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2299),   -- Motorola Moto G84 5G: Screen
  ('d46c54a3-9787-47f1-90b2-06e00d043dd9', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2299),   -- Motorola Moto G84 5G: OLED Display
  ('d46c54a3-9787-47f1-90b2-06e00d043dd9', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1499),   -- Motorola Moto G84 5G: Battery
  ('d46c54a3-9787-47f1-90b2-06e00d043dd9', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1299),   -- Motorola Moto G84 5G: Back Glass
  ('ed486064-4f72-43ed-8732-da90a7dffbe9', '615bfbb2-27d6-4d42-bb1f-0b12a83c35a2', 2999),   -- Motorola Moto Edge 40: Screen
  ('ed486064-4f72-43ed-8732-da90a7dffbe9', '36184616-159e-439e-ad4a-14ee9a18f3ba', 2999),   -- Motorola Moto Edge 40: OLED Display
  ('ed486064-4f72-43ed-8732-da90a7dffbe9', '362bfcad-db8b-461f-bc37-40a69cec5dcc', 1799),   -- Motorola Moto Edge 40: Battery
  ('ed486064-4f72-43ed-8732-da90a7dffbe9', '92492e9a-5dbf-4c09-938f-c187efa0a044', 1499)    -- Motorola Moto Edge 40: Back Glass
ON CONFLICT (model_id, repair_subcategory_id)
DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

COMMIT;

-- After all 3 override + seed steps, total per-model overrides = 80 (flagship) + 112 (mid-range) = 192 rows.

-- ============================================================================
-- Looplic — display-SYMPTOM price overrides (= screen price per model)
-- ============================================================================
-- Closes the pricing hole where display-symptom repairs (Touch Not Working,
-- LCD Replacement, Green Line, Black Screen, Dead Pixels, Display Flickering)
-- stayed at the ~2,299 uniform value on flagships, undercutting the real
-- screen-replacement price. For the 48 curated models these 6 repair types are
-- set to that model's screen price. 48 x 6 = 288 rows. Idempotent upsert.
-- Run after the flagship + mid-range override sheets. Still before go-live.
-- ============================================================================

BEGIN;

INSERT INTO model_repair_subcategory_prices (model_id, repair_subcategory_id, price) VALUES
  ('a38f8896-961c-4d57-975f-fad9ca80068f', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 3999),   -- Apple iPhone 11: Black Screen
  ('a38f8896-961c-4d57-975f-fad9ca80068f', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 3999),   -- Apple iPhone 11: Dead Pixels
  ('a38f8896-961c-4d57-975f-fad9ca80068f', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 3999),   -- Apple iPhone 11: Display Flickering
  ('a38f8896-961c-4d57-975f-fad9ca80068f', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 3999),   -- Apple iPhone 11: Green Line Issue
  ('a38f8896-961c-4d57-975f-fad9ca80068f', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 3999),   -- Apple iPhone 11: LCD Replacement
  ('a38f8896-961c-4d57-975f-fad9ca80068f', 'a0fea686-a730-45aa-8da6-38bab0b57926', 3999),   -- Apple iPhone 11: Touch Not Working
  ('8c2656dd-e565-4480-a56a-cec1576eb0e7', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 6499),   -- Apple iPhone 12: Black Screen
  ('8c2656dd-e565-4480-a56a-cec1576eb0e7', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 6499),   -- Apple iPhone 12: Dead Pixels
  ('8c2656dd-e565-4480-a56a-cec1576eb0e7', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 6499),   -- Apple iPhone 12: Display Flickering
  ('8c2656dd-e565-4480-a56a-cec1576eb0e7', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 6499),   -- Apple iPhone 12: Green Line Issue
  ('8c2656dd-e565-4480-a56a-cec1576eb0e7', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 6499),   -- Apple iPhone 12: LCD Replacement
  ('8c2656dd-e565-4480-a56a-cec1576eb0e7', 'a0fea686-a730-45aa-8da6-38bab0b57926', 6499),   -- Apple iPhone 12: Touch Not Working
  ('2fa5d82f-1c3f-4488-b49c-c3e634c60bd3', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 7499),   -- Apple iPhone 13: Black Screen
  ('2fa5d82f-1c3f-4488-b49c-c3e634c60bd3', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 7499),   -- Apple iPhone 13: Dead Pixels
  ('2fa5d82f-1c3f-4488-b49c-c3e634c60bd3', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 7499),   -- Apple iPhone 13: Display Flickering
  ('2fa5d82f-1c3f-4488-b49c-c3e634c60bd3', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 7499),   -- Apple iPhone 13: Green Line Issue
  ('2fa5d82f-1c3f-4488-b49c-c3e634c60bd3', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 7499),   -- Apple iPhone 13: LCD Replacement
  ('2fa5d82f-1c3f-4488-b49c-c3e634c60bd3', 'a0fea686-a730-45aa-8da6-38bab0b57926', 7499),   -- Apple iPhone 13: Touch Not Working
  ('13246998-ddd9-405b-b7e5-9117c116d8dd', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 8499),   -- Apple iPhone 14: Black Screen
  ('13246998-ddd9-405b-b7e5-9117c116d8dd', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 8499),   -- Apple iPhone 14: Dead Pixels
  ('13246998-ddd9-405b-b7e5-9117c116d8dd', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 8499),   -- Apple iPhone 14: Display Flickering
  ('13246998-ddd9-405b-b7e5-9117c116d8dd', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 8499),   -- Apple iPhone 14: Green Line Issue
  ('13246998-ddd9-405b-b7e5-9117c116d8dd', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 8499),   -- Apple iPhone 14: LCD Replacement
  ('13246998-ddd9-405b-b7e5-9117c116d8dd', 'a0fea686-a730-45aa-8da6-38bab0b57926', 8499),   -- Apple iPhone 14: Touch Not Working
  ('4aad1dee-bd45-4251-b5b8-e4866edc27a8', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 9499),   -- Apple iPhone 15: Black Screen
  ('4aad1dee-bd45-4251-b5b8-e4866edc27a8', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 9499),   -- Apple iPhone 15: Dead Pixels
  ('4aad1dee-bd45-4251-b5b8-e4866edc27a8', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 9499),   -- Apple iPhone 15: Display Flickering
  ('4aad1dee-bd45-4251-b5b8-e4866edc27a8', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 9499),   -- Apple iPhone 15: Green Line Issue
  ('4aad1dee-bd45-4251-b5b8-e4866edc27a8', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 9499),   -- Apple iPhone 15: LCD Replacement
  ('4aad1dee-bd45-4251-b5b8-e4866edc27a8', 'a0fea686-a730-45aa-8da6-38bab0b57926', 9499),   -- Apple iPhone 15: Touch Not Working
  ('a03a1c51-284c-4db4-896c-3d3ed29cb790', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 7499),   -- Apple iPhone 12 Pro: Black Screen
  ('a03a1c51-284c-4db4-896c-3d3ed29cb790', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 7499),   -- Apple iPhone 12 Pro: Dead Pixels
  ('a03a1c51-284c-4db4-896c-3d3ed29cb790', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 7499),   -- Apple iPhone 12 Pro: Display Flickering
  ('a03a1c51-284c-4db4-896c-3d3ed29cb790', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 7499),   -- Apple iPhone 12 Pro: Green Line Issue
  ('a03a1c51-284c-4db4-896c-3d3ed29cb790', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 7499),   -- Apple iPhone 12 Pro: LCD Replacement
  ('a03a1c51-284c-4db4-896c-3d3ed29cb790', 'a0fea686-a730-45aa-8da6-38bab0b57926', 7499),   -- Apple iPhone 12 Pro: Touch Not Working
  ('bd9f5b40-b2d7-4533-b0e9-535f77da1a34', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 8999),   -- Apple iPhone 13 Pro: Black Screen
  ('bd9f5b40-b2d7-4533-b0e9-535f77da1a34', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 8999),   -- Apple iPhone 13 Pro: Dead Pixels
  ('bd9f5b40-b2d7-4533-b0e9-535f77da1a34', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 8999),   -- Apple iPhone 13 Pro: Display Flickering
  ('bd9f5b40-b2d7-4533-b0e9-535f77da1a34', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 8999),   -- Apple iPhone 13 Pro: Green Line Issue
  ('bd9f5b40-b2d7-4533-b0e9-535f77da1a34', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 8999),   -- Apple iPhone 13 Pro: LCD Replacement
  ('bd9f5b40-b2d7-4533-b0e9-535f77da1a34', 'a0fea686-a730-45aa-8da6-38bab0b57926', 8999),   -- Apple iPhone 13 Pro: Touch Not Working
  ('1d7aefa3-c401-4f67-b429-155d2a6e91c4', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 10999),   -- Apple iPhone 14 Pro: Black Screen
  ('1d7aefa3-c401-4f67-b429-155d2a6e91c4', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 10999),   -- Apple iPhone 14 Pro: Dead Pixels
  ('1d7aefa3-c401-4f67-b429-155d2a6e91c4', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 10999),   -- Apple iPhone 14 Pro: Display Flickering
  ('1d7aefa3-c401-4f67-b429-155d2a6e91c4', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 10999),   -- Apple iPhone 14 Pro: Green Line Issue
  ('1d7aefa3-c401-4f67-b429-155d2a6e91c4', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 10999),   -- Apple iPhone 14 Pro: LCD Replacement
  ('1d7aefa3-c401-4f67-b429-155d2a6e91c4', 'a0fea686-a730-45aa-8da6-38bab0b57926', 10999),   -- Apple iPhone 14 Pro: Touch Not Working
  ('a63b7e3d-0f6b-4e27-8630-d4fb81d02c62', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 12999),   -- Apple iPhone 15 Pro Max: Black Screen
  ('a63b7e3d-0f6b-4e27-8630-d4fb81d02c62', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 12999),   -- Apple iPhone 15 Pro Max: Dead Pixels
  ('a63b7e3d-0f6b-4e27-8630-d4fb81d02c62', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 12999),   -- Apple iPhone 15 Pro Max: Display Flickering
  ('a63b7e3d-0f6b-4e27-8630-d4fb81d02c62', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 12999),   -- Apple iPhone 15 Pro Max: Green Line Issue
  ('a63b7e3d-0f6b-4e27-8630-d4fb81d02c62', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 12999),   -- Apple iPhone 15 Pro Max: LCD Replacement
  ('a63b7e3d-0f6b-4e27-8630-d4fb81d02c62', 'a0fea686-a730-45aa-8da6-38bab0b57926', 12999),   -- Apple iPhone 15 Pro Max: Touch Not Working
  ('89b1c8e8-fbf5-4ff1-94f3-78742b146a16', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 14999),   -- Apple iPhone 16 Pro Max: Black Screen
  ('89b1c8e8-fbf5-4ff1-94f3-78742b146a16', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 14999),   -- Apple iPhone 16 Pro Max: Dead Pixels
  ('89b1c8e8-fbf5-4ff1-94f3-78742b146a16', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 14999),   -- Apple iPhone 16 Pro Max: Display Flickering
  ('89b1c8e8-fbf5-4ff1-94f3-78742b146a16', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 14999),   -- Apple iPhone 16 Pro Max: Green Line Issue
  ('89b1c8e8-fbf5-4ff1-94f3-78742b146a16', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 14999),   -- Apple iPhone 16 Pro Max: LCD Replacement
  ('89b1c8e8-fbf5-4ff1-94f3-78742b146a16', 'a0fea686-a730-45aa-8da6-38bab0b57926', 14999),   -- Apple iPhone 16 Pro Max: Touch Not Working
  ('49879d0b-4fc6-4cc2-ae1c-581d74ab4312', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 6499),   -- Samsung Galaxy S21 5G: Black Screen
  ('49879d0b-4fc6-4cc2-ae1c-581d74ab4312', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 6499),   -- Samsung Galaxy S21 5G: Dead Pixels
  ('49879d0b-4fc6-4cc2-ae1c-581d74ab4312', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 6499),   -- Samsung Galaxy S21 5G: Display Flickering
  ('49879d0b-4fc6-4cc2-ae1c-581d74ab4312', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 6499),   -- Samsung Galaxy S21 5G: Green Line Issue
  ('49879d0b-4fc6-4cc2-ae1c-581d74ab4312', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 6499),   -- Samsung Galaxy S21 5G: LCD Replacement
  ('49879d0b-4fc6-4cc2-ae1c-581d74ab4312', 'a0fea686-a730-45aa-8da6-38bab0b57926', 6499),   -- Samsung Galaxy S21 5G: Touch Not Working
  ('620d4773-b2d2-429d-9aa5-d6ff2151f258', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 7499),   -- Samsung Galaxy S22 5G: Black Screen
  ('620d4773-b2d2-429d-9aa5-d6ff2151f258', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 7499),   -- Samsung Galaxy S22 5G: Dead Pixels
  ('620d4773-b2d2-429d-9aa5-d6ff2151f258', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 7499),   -- Samsung Galaxy S22 5G: Display Flickering
  ('620d4773-b2d2-429d-9aa5-d6ff2151f258', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 7499),   -- Samsung Galaxy S22 5G: Green Line Issue
  ('620d4773-b2d2-429d-9aa5-d6ff2151f258', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 7499),   -- Samsung Galaxy S22 5G: LCD Replacement
  ('620d4773-b2d2-429d-9aa5-d6ff2151f258', 'a0fea686-a730-45aa-8da6-38bab0b57926', 7499),   -- Samsung Galaxy S22 5G: Touch Not Working
  ('5378d234-52f6-4e0a-9a3a-14b60652731a', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 8499),   -- Samsung Galaxy S23 5G: Black Screen
  ('5378d234-52f6-4e0a-9a3a-14b60652731a', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 8499),   -- Samsung Galaxy S23 5G: Dead Pixels
  ('5378d234-52f6-4e0a-9a3a-14b60652731a', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 8499),   -- Samsung Galaxy S23 5G: Display Flickering
  ('5378d234-52f6-4e0a-9a3a-14b60652731a', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 8499),   -- Samsung Galaxy S23 5G: Green Line Issue
  ('5378d234-52f6-4e0a-9a3a-14b60652731a', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 8499),   -- Samsung Galaxy S23 5G: LCD Replacement
  ('5378d234-52f6-4e0a-9a3a-14b60652731a', 'a0fea686-a730-45aa-8da6-38bab0b57926', 8499),   -- Samsung Galaxy S23 5G: Touch Not Working
  ('464f2033-377e-49d6-9f41-fb7b6aeba76b', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 12999),   -- Samsung Galaxy S23 Ultra 5G: Black Screen
  ('464f2033-377e-49d6-9f41-fb7b6aeba76b', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 12999),   -- Samsung Galaxy S23 Ultra 5G: Dead Pixels
  ('464f2033-377e-49d6-9f41-fb7b6aeba76b', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 12999),   -- Samsung Galaxy S23 Ultra 5G: Display Flickering
  ('464f2033-377e-49d6-9f41-fb7b6aeba76b', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 12999),   -- Samsung Galaxy S23 Ultra 5G: Green Line Issue
  ('464f2033-377e-49d6-9f41-fb7b6aeba76b', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 12999),   -- Samsung Galaxy S23 Ultra 5G: LCD Replacement
  ('464f2033-377e-49d6-9f41-fb7b6aeba76b', 'a0fea686-a730-45aa-8da6-38bab0b57926', 12999),   -- Samsung Galaxy S23 Ultra 5G: Touch Not Working
  ('1a46f8b4-6594-4b17-b5b9-0b72f905178e', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 14999),   -- Samsung Galaxy S24 Ultra 5G: Black Screen
  ('1a46f8b4-6594-4b17-b5b9-0b72f905178e', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 14999),   -- Samsung Galaxy S24 Ultra 5G: Dead Pixels
  ('1a46f8b4-6594-4b17-b5b9-0b72f905178e', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 14999),   -- Samsung Galaxy S24 Ultra 5G: Display Flickering
  ('1a46f8b4-6594-4b17-b5b9-0b72f905178e', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 14999),   -- Samsung Galaxy S24 Ultra 5G: Green Line Issue
  ('1a46f8b4-6594-4b17-b5b9-0b72f905178e', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 14999),   -- Samsung Galaxy S24 Ultra 5G: LCD Replacement
  ('1a46f8b4-6594-4b17-b5b9-0b72f905178e', 'a0fea686-a730-45aa-8da6-38bab0b57926', 14999),   -- Samsung Galaxy S24 Ultra 5G: Touch Not Working
  ('71a3c2bd-2abe-4342-9769-3850965b504f', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 5499),   -- OnePlus 9: Black Screen
  ('71a3c2bd-2abe-4342-9769-3850965b504f', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 5499),   -- OnePlus 9: Dead Pixels
  ('71a3c2bd-2abe-4342-9769-3850965b504f', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 5499),   -- OnePlus 9: Display Flickering
  ('71a3c2bd-2abe-4342-9769-3850965b504f', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 5499),   -- OnePlus 9: Green Line Issue
  ('71a3c2bd-2abe-4342-9769-3850965b504f', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 5499),   -- OnePlus 9: LCD Replacement
  ('71a3c2bd-2abe-4342-9769-3850965b504f', 'a0fea686-a730-45aa-8da6-38bab0b57926', 5499),   -- OnePlus 9: Touch Not Working
  ('d9d4474a-d421-4cf7-85f0-11c7d8622cee', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 7499),   -- OnePlus 11: Black Screen
  ('d9d4474a-d421-4cf7-85f0-11c7d8622cee', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 7499),   -- OnePlus 11: Dead Pixels
  ('d9d4474a-d421-4cf7-85f0-11c7d8622cee', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 7499),   -- OnePlus 11: Display Flickering
  ('d9d4474a-d421-4cf7-85f0-11c7d8622cee', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 7499),   -- OnePlus 11: Green Line Issue
  ('d9d4474a-d421-4cf7-85f0-11c7d8622cee', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 7499),   -- OnePlus 11: LCD Replacement
  ('d9d4474a-d421-4cf7-85f0-11c7d8622cee', 'a0fea686-a730-45aa-8da6-38bab0b57926', 7499),   -- OnePlus 11: Touch Not Working
  ('e3366182-1097-4e0d-a07a-f86f4797f15b', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 8499),   -- OnePlus 12: Black Screen
  ('e3366182-1097-4e0d-a07a-f86f4797f15b', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 8499),   -- OnePlus 12: Dead Pixels
  ('e3366182-1097-4e0d-a07a-f86f4797f15b', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 8499),   -- OnePlus 12: Display Flickering
  ('e3366182-1097-4e0d-a07a-f86f4797f15b', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 8499),   -- OnePlus 12: Green Line Issue
  ('e3366182-1097-4e0d-a07a-f86f4797f15b', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 8499),   -- OnePlus 12: LCD Replacement
  ('e3366182-1097-4e0d-a07a-f86f4797f15b', 'a0fea686-a730-45aa-8da6-38bab0b57926', 8499),   -- OnePlus 12: Touch Not Working
  ('fd62ae4a-6cdd-4034-b1ed-39fb47b96dde', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 6499),   -- Google Pixel 7: Black Screen
  ('fd62ae4a-6cdd-4034-b1ed-39fb47b96dde', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 6499),   -- Google Pixel 7: Dead Pixels
  ('fd62ae4a-6cdd-4034-b1ed-39fb47b96dde', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 6499),   -- Google Pixel 7: Display Flickering
  ('fd62ae4a-6cdd-4034-b1ed-39fb47b96dde', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 6499),   -- Google Pixel 7: Green Line Issue
  ('fd62ae4a-6cdd-4034-b1ed-39fb47b96dde', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 6499),   -- Google Pixel 7: LCD Replacement
  ('fd62ae4a-6cdd-4034-b1ed-39fb47b96dde', 'a0fea686-a730-45aa-8da6-38bab0b57926', 6499),   -- Google Pixel 7: Touch Not Working
  ('883e0c4e-08b9-4b4b-8c31-347a06a4d597', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 7999),   -- Google Pixel 8: Black Screen
  ('883e0c4e-08b9-4b4b-8c31-347a06a4d597', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 7999),   -- Google Pixel 8: Dead Pixels
  ('883e0c4e-08b9-4b4b-8c31-347a06a4d597', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 7999),   -- Google Pixel 8: Display Flickering
  ('883e0c4e-08b9-4b4b-8c31-347a06a4d597', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 7999),   -- Google Pixel 8: Green Line Issue
  ('883e0c4e-08b9-4b4b-8c31-347a06a4d597', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 7999),   -- Google Pixel 8: LCD Replacement
  ('883e0c4e-08b9-4b4b-8c31-347a06a4d597', 'a0fea686-a730-45aa-8da6-38bab0b57926', 7999),   -- Google Pixel 8: Touch Not Working
  ('7e4d4e56-09be-473c-8623-997ed6d75eb4', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2999),   -- Xiaomi Redmi Note 13 Pro Plus 5G: Black Screen
  ('7e4d4e56-09be-473c-8623-997ed6d75eb4', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2999),   -- Xiaomi Redmi Note 13 Pro Plus 5G: Dead Pixels
  ('7e4d4e56-09be-473c-8623-997ed6d75eb4', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2999),   -- Xiaomi Redmi Note 13 Pro Plus 5G: Display Flickering
  ('7e4d4e56-09be-473c-8623-997ed6d75eb4', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2999),   -- Xiaomi Redmi Note 13 Pro Plus 5G: Green Line Issue
  ('7e4d4e56-09be-473c-8623-997ed6d75eb4', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2999),   -- Xiaomi Redmi Note 13 Pro Plus 5G: LCD Replacement
  ('7e4d4e56-09be-473c-8623-997ed6d75eb4', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2999),   -- Xiaomi Redmi Note 13 Pro Plus 5G: Touch Not Working
  ('e015015c-cd2f-48ec-a7e5-98a094c77db3', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 1999),   -- Xiaomi Redmi Note 12: Black Screen
  ('e015015c-cd2f-48ec-a7e5-98a094c77db3', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 1999),   -- Xiaomi Redmi Note 12: Dead Pixels
  ('e015015c-cd2f-48ec-a7e5-98a094c77db3', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 1999),   -- Xiaomi Redmi Note 12: Display Flickering
  ('e015015c-cd2f-48ec-a7e5-98a094c77db3', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 1999),   -- Xiaomi Redmi Note 12: Green Line Issue
  ('e015015c-cd2f-48ec-a7e5-98a094c77db3', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 1999),   -- Xiaomi Redmi Note 12: LCD Replacement
  ('e015015c-cd2f-48ec-a7e5-98a094c77db3', 'a0fea686-a730-45aa-8da6-38bab0b57926', 1999),   -- Xiaomi Redmi Note 12: Touch Not Working
  ('4f37fc2c-2ba4-4583-adcd-5d738680d8bd', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 1799),   -- Xiaomi Redmi Note 11: Black Screen
  ('4f37fc2c-2ba4-4583-adcd-5d738680d8bd', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 1799),   -- Xiaomi Redmi Note 11: Dead Pixels
  ('4f37fc2c-2ba4-4583-adcd-5d738680d8bd', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 1799),   -- Xiaomi Redmi Note 11: Display Flickering
  ('4f37fc2c-2ba4-4583-adcd-5d738680d8bd', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 1799),   -- Xiaomi Redmi Note 11: Green Line Issue
  ('4f37fc2c-2ba4-4583-adcd-5d738680d8bd', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 1799),   -- Xiaomi Redmi Note 11: LCD Replacement
  ('4f37fc2c-2ba4-4583-adcd-5d738680d8bd', 'a0fea686-a730-45aa-8da6-38bab0b57926', 1799),   -- Xiaomi Redmi Note 11: Touch Not Working
  ('4e3177ec-9664-43b2-b37a-ad2a65e9697e', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 1799),   -- Xiaomi Redmi Note 10: Black Screen
  ('4e3177ec-9664-43b2-b37a-ad2a65e9697e', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 1799),   -- Xiaomi Redmi Note 10: Dead Pixels
  ('4e3177ec-9664-43b2-b37a-ad2a65e9697e', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 1799),   -- Xiaomi Redmi Note 10: Display Flickering
  ('4e3177ec-9664-43b2-b37a-ad2a65e9697e', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 1799),   -- Xiaomi Redmi Note 10: Green Line Issue
  ('4e3177ec-9664-43b2-b37a-ad2a65e9697e', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 1799),   -- Xiaomi Redmi Note 10: LCD Replacement
  ('4e3177ec-9664-43b2-b37a-ad2a65e9697e', 'a0fea686-a730-45aa-8da6-38bab0b57926', 1799),   -- Xiaomi Redmi Note 10: Touch Not Working
  ('4f47c8d9-e53c-4bc3-8519-2321ebf35d16', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 1499),   -- Xiaomi Redmi 12: Black Screen
  ('4f47c8d9-e53c-4bc3-8519-2321ebf35d16', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 1499),   -- Xiaomi Redmi 12: Dead Pixels
  ('4f47c8d9-e53c-4bc3-8519-2321ebf35d16', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 1499),   -- Xiaomi Redmi 12: Display Flickering
  ('4f47c8d9-e53c-4bc3-8519-2321ebf35d16', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 1499),   -- Xiaomi Redmi 12: Green Line Issue
  ('4f47c8d9-e53c-4bc3-8519-2321ebf35d16', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 1499),   -- Xiaomi Redmi 12: LCD Replacement
  ('4f47c8d9-e53c-4bc3-8519-2321ebf35d16', 'a0fea686-a730-45aa-8da6-38bab0b57926', 1499),   -- Xiaomi Redmi 12: Touch Not Working
  ('0e790157-0a18-45c5-ac6c-0af19c703747', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 5999),   -- Xiaomi 13 Pro 5G: Black Screen
  ('0e790157-0a18-45c5-ac6c-0af19c703747', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 5999),   -- Xiaomi 13 Pro 5G: Dead Pixels
  ('0e790157-0a18-45c5-ac6c-0af19c703747', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 5999),   -- Xiaomi 13 Pro 5G: Display Flickering
  ('0e790157-0a18-45c5-ac6c-0af19c703747', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 5999),   -- Xiaomi 13 Pro 5G: Green Line Issue
  ('0e790157-0a18-45c5-ac6c-0af19c703747', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 5999),   -- Xiaomi 13 Pro 5G: LCD Replacement
  ('0e790157-0a18-45c5-ac6c-0af19c703747', 'a0fea686-a730-45aa-8da6-38bab0b57926', 5999),   -- Xiaomi 13 Pro 5G: Touch Not Working
  ('66c3bc26-5b9d-42a7-a43b-dbb6b41c0a16', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2299),   -- POCO X5: Black Screen
  ('66c3bc26-5b9d-42a7-a43b-dbb6b41c0a16', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2299),   -- POCO X5: Dead Pixels
  ('66c3bc26-5b9d-42a7-a43b-dbb6b41c0a16', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2299),   -- POCO X5: Display Flickering
  ('66c3bc26-5b9d-42a7-a43b-dbb6b41c0a16', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2299),   -- POCO X5: Green Line Issue
  ('66c3bc26-5b9d-42a7-a43b-dbb6b41c0a16', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2299),   -- POCO X5: LCD Replacement
  ('66c3bc26-5b9d-42a7-a43b-dbb6b41c0a16', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2299),   -- POCO X5: Touch Not Working
  ('976adde3-55b0-485f-8d1b-23cc29ba306c', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 1799),   -- POCO M6 Pro 5G: Black Screen
  ('976adde3-55b0-485f-8d1b-23cc29ba306c', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 1799),   -- POCO M6 Pro 5G: Dead Pixels
  ('976adde3-55b0-485f-8d1b-23cc29ba306c', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 1799),   -- POCO M6 Pro 5G: Display Flickering
  ('976adde3-55b0-485f-8d1b-23cc29ba306c', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 1799),   -- POCO M6 Pro 5G: Green Line Issue
  ('976adde3-55b0-485f-8d1b-23cc29ba306c', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 1799),   -- POCO M6 Pro 5G: LCD Replacement
  ('976adde3-55b0-485f-8d1b-23cc29ba306c', 'a0fea686-a730-45aa-8da6-38bab0b57926', 1799),   -- POCO M6 Pro 5G: Touch Not Working
  ('ccdcc500-29bd-4849-a2fc-d17acd5bf058', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2999),   -- Realme 12 Pro 5G: Black Screen
  ('ccdcc500-29bd-4849-a2fc-d17acd5bf058', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2999),   -- Realme 12 Pro 5G: Dead Pixels
  ('ccdcc500-29bd-4849-a2fc-d17acd5bf058', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2999),   -- Realme 12 Pro 5G: Display Flickering
  ('ccdcc500-29bd-4849-a2fc-d17acd5bf058', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2999),   -- Realme 12 Pro 5G: Green Line Issue
  ('ccdcc500-29bd-4849-a2fc-d17acd5bf058', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2999),   -- Realme 12 Pro 5G: LCD Replacement
  ('ccdcc500-29bd-4849-a2fc-d17acd5bf058', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2999),   -- Realme 12 Pro 5G: Touch Not Working
  ('0ade1df1-dd5c-4f3d-b263-9945d5ad5753', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2299),   -- Realme 11 5G: Black Screen
  ('0ade1df1-dd5c-4f3d-b263-9945d5ad5753', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2299),   -- Realme 11 5G: Dead Pixels
  ('0ade1df1-dd5c-4f3d-b263-9945d5ad5753', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2299),   -- Realme 11 5G: Display Flickering
  ('0ade1df1-dd5c-4f3d-b263-9945d5ad5753', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2299),   -- Realme 11 5G: Green Line Issue
  ('0ade1df1-dd5c-4f3d-b263-9945d5ad5753', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2299),   -- Realme 11 5G: LCD Replacement
  ('0ade1df1-dd5c-4f3d-b263-9945d5ad5753', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2299),   -- Realme 11 5G: Touch Not Working
  ('fbedc115-43ce-4750-9291-4db1fbd6bba9', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 1999),   -- Realme 10: Black Screen
  ('fbedc115-43ce-4750-9291-4db1fbd6bba9', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 1999),   -- Realme 10: Dead Pixels
  ('fbedc115-43ce-4750-9291-4db1fbd6bba9', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 1999),   -- Realme 10: Display Flickering
  ('fbedc115-43ce-4750-9291-4db1fbd6bba9', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 1999),   -- Realme 10: Green Line Issue
  ('fbedc115-43ce-4750-9291-4db1fbd6bba9', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 1999),   -- Realme 10: LCD Replacement
  ('fbedc115-43ce-4750-9291-4db1fbd6bba9', 'a0fea686-a730-45aa-8da6-38bab0b57926', 1999),   -- Realme 10: Touch Not Working
  ('6dd36e00-5d73-4fb8-b71b-1df480e293ae', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2199),   -- Realme Narzo 60 5G: Black Screen
  ('6dd36e00-5d73-4fb8-b71b-1df480e293ae', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2199),   -- Realme Narzo 60 5G: Dead Pixels
  ('6dd36e00-5d73-4fb8-b71b-1df480e293ae', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2199),   -- Realme Narzo 60 5G: Display Flickering
  ('6dd36e00-5d73-4fb8-b71b-1df480e293ae', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2199),   -- Realme Narzo 60 5G: Green Line Issue
  ('6dd36e00-5d73-4fb8-b71b-1df480e293ae', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2199),   -- Realme Narzo 60 5G: LCD Replacement
  ('6dd36e00-5d73-4fb8-b71b-1df480e293ae', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2199),   -- Realme Narzo 60 5G: Touch Not Working
  ('196f880c-f3bd-4b7b-ad60-50dde917e9d1', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 1499),   -- Realme C55: Black Screen
  ('196f880c-f3bd-4b7b-ad60-50dde917e9d1', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 1499),   -- Realme C55: Dead Pixels
  ('196f880c-f3bd-4b7b-ad60-50dde917e9d1', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 1499),   -- Realme C55: Display Flickering
  ('196f880c-f3bd-4b7b-ad60-50dde917e9d1', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 1499),   -- Realme C55: Green Line Issue
  ('196f880c-f3bd-4b7b-ad60-50dde917e9d1', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 1499),   -- Realme C55: LCD Replacement
  ('196f880c-f3bd-4b7b-ad60-50dde917e9d1', 'a0fea686-a730-45aa-8da6-38bab0b57926', 1499),   -- Realme C55: Touch Not Working
  ('13d87e28-9393-453e-9f2b-4bd5412eaee0', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2999),   -- Vivo V29: Black Screen
  ('13d87e28-9393-453e-9f2b-4bd5412eaee0', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2999),   -- Vivo V29: Dead Pixels
  ('13d87e28-9393-453e-9f2b-4bd5412eaee0', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2999),   -- Vivo V29: Display Flickering
  ('13d87e28-9393-453e-9f2b-4bd5412eaee0', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2999),   -- Vivo V29: Green Line Issue
  ('13d87e28-9393-453e-9f2b-4bd5412eaee0', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2999),   -- Vivo V29: LCD Replacement
  ('13d87e28-9393-453e-9f2b-4bd5412eaee0', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2999),   -- Vivo V29: Touch Not Working
  ('ab87ecd0-07f4-49ec-9404-4fe86b55c9dc', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2299),   -- Vivo T2 5G: Black Screen
  ('ab87ecd0-07f4-49ec-9404-4fe86b55c9dc', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2299),   -- Vivo T2 5G: Dead Pixels
  ('ab87ecd0-07f4-49ec-9404-4fe86b55c9dc', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2299),   -- Vivo T2 5G: Display Flickering
  ('ab87ecd0-07f4-49ec-9404-4fe86b55c9dc', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2299),   -- Vivo T2 5G: Green Line Issue
  ('ab87ecd0-07f4-49ec-9404-4fe86b55c9dc', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2299),   -- Vivo T2 5G: LCD Replacement
  ('ab87ecd0-07f4-49ec-9404-4fe86b55c9dc', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2299),   -- Vivo T2 5G: Touch Not Working
  ('8355ccf4-a6d9-4786-8490-943a6ef3ab29', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2299),   -- Vivo Y100 5G: Black Screen
  ('8355ccf4-a6d9-4786-8490-943a6ef3ab29', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2299),   -- Vivo Y100 5G: Dead Pixels
  ('8355ccf4-a6d9-4786-8490-943a6ef3ab29', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2299),   -- Vivo Y100 5G: Display Flickering
  ('8355ccf4-a6d9-4786-8490-943a6ef3ab29', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2299),   -- Vivo Y100 5G: Green Line Issue
  ('8355ccf4-a6d9-4786-8490-943a6ef3ab29', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2299),   -- Vivo Y100 5G: LCD Replacement
  ('8355ccf4-a6d9-4786-8490-943a6ef3ab29', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2299),   -- Vivo Y100 5G: Touch Not Working
  ('df8f85b8-2c9b-4e26-9bc4-29d1b2d6ad0d', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 1699),   -- Vivo Y28 5G: Black Screen
  ('df8f85b8-2c9b-4e26-9bc4-29d1b2d6ad0d', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 1699),   -- Vivo Y28 5G: Dead Pixels
  ('df8f85b8-2c9b-4e26-9bc4-29d1b2d6ad0d', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 1699),   -- Vivo Y28 5G: Display Flickering
  ('df8f85b8-2c9b-4e26-9bc4-29d1b2d6ad0d', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 1699),   -- Vivo Y28 5G: Green Line Issue
  ('df8f85b8-2c9b-4e26-9bc4-29d1b2d6ad0d', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 1699),   -- Vivo Y28 5G: LCD Replacement
  ('df8f85b8-2c9b-4e26-9bc4-29d1b2d6ad0d', 'a0fea686-a730-45aa-8da6-38bab0b57926', 1699),   -- Vivo Y28 5G: Touch Not Working
  ('3761d51c-7080-41f1-b2c8-624514c86f1f', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2999),   -- OPPO Reno 8 5G: Black Screen
  ('3761d51c-7080-41f1-b2c8-624514c86f1f', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2999),   -- OPPO Reno 8 5G: Dead Pixels
  ('3761d51c-7080-41f1-b2c8-624514c86f1f', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2999),   -- OPPO Reno 8 5G: Display Flickering
  ('3761d51c-7080-41f1-b2c8-624514c86f1f', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2999),   -- OPPO Reno 8 5G: Green Line Issue
  ('3761d51c-7080-41f1-b2c8-624514c86f1f', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2999),   -- OPPO Reno 8 5G: LCD Replacement
  ('3761d51c-7080-41f1-b2c8-624514c86f1f', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2999),   -- OPPO Reno 8 5G: Touch Not Working
  ('3f86283b-ba55-43e2-a770-2caea66a8c9f', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 1999),   -- OPPO A78: Black Screen
  ('3f86283b-ba55-43e2-a770-2caea66a8c9f', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 1999),   -- OPPO A78: Dead Pixels
  ('3f86283b-ba55-43e2-a770-2caea66a8c9f', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 1999),   -- OPPO A78: Display Flickering
  ('3f86283b-ba55-43e2-a770-2caea66a8c9f', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 1999),   -- OPPO A78: Green Line Issue
  ('3f86283b-ba55-43e2-a770-2caea66a8c9f', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 1999),   -- OPPO A78: LCD Replacement
  ('3f86283b-ba55-43e2-a770-2caea66a8c9f', 'a0fea686-a730-45aa-8da6-38bab0b57926', 1999),   -- OPPO A78: Touch Not Working
  ('00dc63e5-4f37-465a-9709-429909fdde94', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2299),   -- OPPO F23 5G: Black Screen
  ('00dc63e5-4f37-465a-9709-429909fdde94', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2299),   -- OPPO F23 5G: Dead Pixels
  ('00dc63e5-4f37-465a-9709-429909fdde94', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2299),   -- OPPO F23 5G: Display Flickering
  ('00dc63e5-4f37-465a-9709-429909fdde94', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2299),   -- OPPO F23 5G: Green Line Issue
  ('00dc63e5-4f37-465a-9709-429909fdde94', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2299),   -- OPPO F23 5G: LCD Replacement
  ('00dc63e5-4f37-465a-9709-429909fdde94', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2299),   -- OPPO F23 5G: Touch Not Working
  ('4d47b198-1996-425d-9929-dc5477b8eae0', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2999),   -- Samsung Galaxy A54 5G: Black Screen
  ('4d47b198-1996-425d-9929-dc5477b8eae0', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2999),   -- Samsung Galaxy A54 5G: Dead Pixels
  ('4d47b198-1996-425d-9929-dc5477b8eae0', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2999),   -- Samsung Galaxy A54 5G: Display Flickering
  ('4d47b198-1996-425d-9929-dc5477b8eae0', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2999),   -- Samsung Galaxy A54 5G: Green Line Issue
  ('4d47b198-1996-425d-9929-dc5477b8eae0', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2999),   -- Samsung Galaxy A54 5G: LCD Replacement
  ('4d47b198-1996-425d-9929-dc5477b8eae0', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2999),   -- Samsung Galaxy A54 5G: Touch Not Working
  ('4083bfe6-bec6-4ccc-a453-aaa462510bcc', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2699),   -- Samsung Galaxy A34 5G: Black Screen
  ('4083bfe6-bec6-4ccc-a453-aaa462510bcc', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2699),   -- Samsung Galaxy A34 5G: Dead Pixels
  ('4083bfe6-bec6-4ccc-a453-aaa462510bcc', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2699),   -- Samsung Galaxy A34 5G: Display Flickering
  ('4083bfe6-bec6-4ccc-a453-aaa462510bcc', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2699),   -- Samsung Galaxy A34 5G: Green Line Issue
  ('4083bfe6-bec6-4ccc-a453-aaa462510bcc', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2699),   -- Samsung Galaxy A34 5G: LCD Replacement
  ('4083bfe6-bec6-4ccc-a453-aaa462510bcc', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2699),   -- Samsung Galaxy A34 5G: Touch Not Working
  ('6b94f9a0-a299-4b7e-be5e-faa10b069f5f', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 1799),   -- Samsung Galaxy A14 5G: Black Screen
  ('6b94f9a0-a299-4b7e-be5e-faa10b069f5f', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 1799),   -- Samsung Galaxy A14 5G: Dead Pixels
  ('6b94f9a0-a299-4b7e-be5e-faa10b069f5f', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 1799),   -- Samsung Galaxy A14 5G: Display Flickering
  ('6b94f9a0-a299-4b7e-be5e-faa10b069f5f', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 1799),   -- Samsung Galaxy A14 5G: Green Line Issue
  ('6b94f9a0-a299-4b7e-be5e-faa10b069f5f', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 1799),   -- Samsung Galaxy A14 5G: LCD Replacement
  ('6b94f9a0-a299-4b7e-be5e-faa10b069f5f', 'a0fea686-a730-45aa-8da6-38bab0b57926', 1799),   -- Samsung Galaxy A14 5G: Touch Not Working
  ('345c36c1-2715-4275-97be-485be04f76d2', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2299),   -- Samsung Galaxy M34 5G: Black Screen
  ('345c36c1-2715-4275-97be-485be04f76d2', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2299),   -- Samsung Galaxy M34 5G: Dead Pixels
  ('345c36c1-2715-4275-97be-485be04f76d2', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2299),   -- Samsung Galaxy M34 5G: Display Flickering
  ('345c36c1-2715-4275-97be-485be04f76d2', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2299),   -- Samsung Galaxy M34 5G: Green Line Issue
  ('345c36c1-2715-4275-97be-485be04f76d2', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2299),   -- Samsung Galaxy M34 5G: LCD Replacement
  ('345c36c1-2715-4275-97be-485be04f76d2', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2299),   -- Samsung Galaxy M34 5G: Touch Not Working
  ('e2b34f52-c552-4e22-a2fe-2f8e64db7caa', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2199),   -- iQOO Z7 5G: Black Screen
  ('e2b34f52-c552-4e22-a2fe-2f8e64db7caa', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2199),   -- iQOO Z7 5G: Dead Pixels
  ('e2b34f52-c552-4e22-a2fe-2f8e64db7caa', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2199),   -- iQOO Z7 5G: Display Flickering
  ('e2b34f52-c552-4e22-a2fe-2f8e64db7caa', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2199),   -- iQOO Z7 5G: Green Line Issue
  ('e2b34f52-c552-4e22-a2fe-2f8e64db7caa', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2199),   -- iQOO Z7 5G: LCD Replacement
  ('e2b34f52-c552-4e22-a2fe-2f8e64db7caa', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2199),   -- iQOO Z7 5G: Touch Not Working
  ('4eb7b846-7fd4-48ae-a0de-408071d450ba', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2699),   -- iQOO Neo 7 5G: Black Screen
  ('4eb7b846-7fd4-48ae-a0de-408071d450ba', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2699),   -- iQOO Neo 7 5G: Dead Pixels
  ('4eb7b846-7fd4-48ae-a0de-408071d450ba', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2699),   -- iQOO Neo 7 5G: Display Flickering
  ('4eb7b846-7fd4-48ae-a0de-408071d450ba', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2699),   -- iQOO Neo 7 5G: Green Line Issue
  ('4eb7b846-7fd4-48ae-a0de-408071d450ba', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2699),   -- iQOO Neo 7 5G: LCD Replacement
  ('4eb7b846-7fd4-48ae-a0de-408071d450ba', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2699),   -- iQOO Neo 7 5G: Touch Not Working
  ('d46c54a3-9787-47f1-90b2-06e00d043dd9', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2299),   -- Motorola Moto G84 5G: Black Screen
  ('d46c54a3-9787-47f1-90b2-06e00d043dd9', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2299),   -- Motorola Moto G84 5G: Dead Pixels
  ('d46c54a3-9787-47f1-90b2-06e00d043dd9', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2299),   -- Motorola Moto G84 5G: Display Flickering
  ('d46c54a3-9787-47f1-90b2-06e00d043dd9', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2299),   -- Motorola Moto G84 5G: Green Line Issue
  ('d46c54a3-9787-47f1-90b2-06e00d043dd9', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2299),   -- Motorola Moto G84 5G: LCD Replacement
  ('d46c54a3-9787-47f1-90b2-06e00d043dd9', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2299),   -- Motorola Moto G84 5G: Touch Not Working
  ('ed486064-4f72-43ed-8732-da90a7dffbe9', '79f9ae83-c9fa-44f5-8700-7449c4e0a18f', 2999),   -- Motorola Moto Edge 40: Black Screen
  ('ed486064-4f72-43ed-8732-da90a7dffbe9', '8f593b29-ce4d-4112-97e0-79d4affb2bcd', 2999),   -- Motorola Moto Edge 40: Dead Pixels
  ('ed486064-4f72-43ed-8732-da90a7dffbe9', '5c8b5ecf-b2b1-4e75-9289-8d33734823b9', 2999),   -- Motorola Moto Edge 40: Display Flickering
  ('ed486064-4f72-43ed-8732-da90a7dffbe9', 'ce22fd55-baa4-44cd-8f63-8898c58845b4', 2999),   -- Motorola Moto Edge 40: Green Line Issue
  ('ed486064-4f72-43ed-8732-da90a7dffbe9', '19f5fc84-4d3a-41b2-85f1-b866aba9cc24', 2999),   -- Motorola Moto Edge 40: LCD Replacement
  ('ed486064-4f72-43ed-8732-da90a7dffbe9', 'a0fea686-a730-45aa-8da6-38bab0b57926', 2999)    -- Motorola Moto Edge 40: Touch Not Working
ON CONFLICT (model_id, repair_subcategory_id)
DO UPDATE SET price = EXCLUDED.price, updated_at = NOW();

COMMIT;

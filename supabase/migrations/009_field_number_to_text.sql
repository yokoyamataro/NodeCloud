-- 圃場番号を INT から TEXT に変更
-- 半角英数記号の任意テキストを許可するため

-- 1. 既存のUNIQUE制約を削除
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_farmer_id_field_number_key;

-- 2. field_number カラムの型を TEXT に変更
ALTER TABLE fields ALTER COLUMN field_number TYPE TEXT USING field_number::TEXT;

-- 3. UNIQUE制約を再作成
ALTER TABLE fields ADD CONSTRAINT fields_farmer_id_field_number_key UNIQUE (farmer_id, field_number);

-- 4. インデックスの再作成（型変更に伴い）
DROP INDEX IF EXISTS idx_fields_farmer;
CREATE INDEX idx_fields_farmer ON fields(farmer_id, field_number);

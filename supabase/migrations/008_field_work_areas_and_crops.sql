-- 圃場×工種ごとの面積テーブル
CREATE TABLE field_work_areas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id        UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    work_type_id    UUID NOT NULL REFERENCES work_types(id),
    area_hectares   NUMERIC(10,4) NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(field_id, work_type_id)
);

-- 作付けマスタ
CREATE TABLE crop_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT UNIQUE NOT NULL,
    display_order   INT NOT NULL DEFAULT 0,
    is_default      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- デフォルトの作付け種類を登録
INSERT INTO crop_types (name, display_order, is_default) VALUES
    ('秋麦', 1, TRUE),
    ('春麦', 2, TRUE),
    ('ビート', 3, TRUE),
    ('いも', 4, TRUE),
    ('小豆', 5, TRUE),
    ('大豆', 6, TRUE),
    ('ビール麦', 7, TRUE),
    ('にんじん', 8, TRUE),
    ('玉ねぎ', 9, TRUE),
    ('デントコーン', 10, TRUE),
    ('牧草', 11, TRUE);

-- 圃場の作付け
CREATE TABLE field_crops (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id        UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    crop_type_id    UUID NOT NULL REFERENCES crop_types(id),
    fiscal_year     INT,
    area_hectares   NUMERIC(10,4),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(field_id, crop_type_id, fiscal_year)
);

-- インデックス
CREATE INDEX idx_field_work_areas_field ON field_work_areas(field_id);
CREATE INDEX idx_field_crops_field ON field_crops(field_id);
CREATE INDEX idx_crop_types_order ON crop_types(display_order);

-- RLS
ALTER TABLE field_work_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_crops ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがアクセス可能（認証後に制限を追加）
CREATE POLICY "field_work_areas_select_policy" ON field_work_areas FOR SELECT USING (true);
CREATE POLICY "field_work_areas_insert_policy" ON field_work_areas FOR INSERT WITH CHECK (true);
CREATE POLICY "field_work_areas_update_policy" ON field_work_areas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "field_work_areas_delete_policy" ON field_work_areas FOR DELETE USING (true);

CREATE POLICY "crop_types_select_policy" ON crop_types FOR SELECT USING (true);
CREATE POLICY "crop_types_insert_policy" ON crop_types FOR INSERT WITH CHECK (true);
CREATE POLICY "crop_types_update_policy" ON crop_types FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "crop_types_delete_policy" ON crop_types FOR DELETE USING (true);

CREATE POLICY "field_crops_select_policy" ON field_crops FOR SELECT USING (true);
CREATE POLICY "field_crops_insert_policy" ON field_crops FOR INSERT WITH CHECK (true);
CREATE POLICY "field_crops_update_policy" ON field_crops FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "field_crops_delete_policy" ON field_crops FOR DELETE USING (true);

-- トリガー
CREATE TRIGGER update_field_work_areas_updated_at
    BEFORE UPDATE ON field_work_areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_field_crops_updated_at
    BEFORE UPDATE ON field_crops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

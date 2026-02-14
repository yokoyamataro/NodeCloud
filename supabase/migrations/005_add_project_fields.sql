-- 工事テーブルに新しいフィールドを追加
-- 年度、工事番号、発注者名、受注者名、座標系

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS fiscal_year INT,
ADD COLUMN IF NOT EXISTS project_number TEXT,
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS contractor_name TEXT,
ADD COLUMN IF NOT EXISTS coordinate_system TEXT;

-- コメント
COMMENT ON COLUMN projects.fiscal_year IS '年度（例: 2024）';
COMMENT ON COLUMN projects.project_number IS '工事番号';
COMMENT ON COLUMN projects.client_name IS '発注者名';
COMMENT ON COLUMN projects.contractor_name IS '受注者名';
COMMENT ON COLUMN projects.coordinate_system IS '座標系（例: EPSG:6677）';

-- projectsテーブルのRLSポリシー（閲覧を全ユーザーに許可）
CREATE POLICY "工事の閲覧を許可" ON projects FOR SELECT USING (true);

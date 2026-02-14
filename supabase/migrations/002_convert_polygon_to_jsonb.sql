-- area_polygonをGEOMETRY型からJSONB型に変更
-- PostGIS形式のままだとsupabase-jsクライアントで直接取得・更新できないため

-- 既存データをバックアップ（必要に応じて）
-- SELECT id, ST_AsGeoJSON(area_polygon) as polygon_geojson FROM fields WHERE area_polygon IS NOT NULL;

-- fieldsテーブルのarea_polygonカラムを変更
ALTER TABLE fields
DROP COLUMN IF EXISTS area_polygon;

ALTER TABLE fields
ADD COLUMN area_polygon JSONB;

-- projectsテーブルも同様に変更
ALTER TABLE projects
DROP COLUMN IF EXISTS area_polygon;

ALTER TABLE projects
ADD COLUMN area_polygon JSONB;

-- インデックスを再作成（JSONB用）
DROP INDEX IF EXISTS idx_fields_area;
DROP INDEX IF EXISTS idx_projects_area;

-- JSONB用のGINインデックス（オプション）
CREATE INDEX idx_fields_area_jsonb ON fields USING GIN(area_polygon);
CREATE INDEX idx_projects_area_jsonb ON projects USING GIN(area_polygon);

-- コメント
COMMENT ON COLUMN fields.area_polygon IS 'GeoJSON Polygon形式で保存';
COMMENT ON COLUMN projects.area_polygon IS 'GeoJSON Polygon形式で保存';

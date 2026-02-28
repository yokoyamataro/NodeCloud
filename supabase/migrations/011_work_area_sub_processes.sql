-- 細部工程テーブル（工種ごとのサブ工程）
CREATE TABLE IF NOT EXISTS work_area_sub_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_work_area_id UUID NOT NULL REFERENCES field_work_areas(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  planned_start DATE,
  planned_end DATE,
  actual_start DATE,
  actual_end DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_sub_processes_field_work_area ON work_area_sub_processes(field_work_area_id);

-- コメント
COMMENT ON TABLE work_area_sub_processes IS '細部工程（工種のサブ工程）';
COMMENT ON COLUMN work_area_sub_processes.field_work_area_id IS '親の工種面積ID';
COMMENT ON COLUMN work_area_sub_processes.name IS '細部工程名';
COMMENT ON COLUMN work_area_sub_processes.display_order IS '表示順';
COMMENT ON COLUMN work_area_sub_processes.planned_start IS '着工予定日';
COMMENT ON COLUMN work_area_sub_processes.planned_end IS '完了予定日';
COMMENT ON COLUMN work_area_sub_processes.actual_start IS '着工日（実績）';
COMMENT ON COLUMN work_area_sub_processes.actual_end IS '完了日（実績）';
COMMENT ON COLUMN work_area_sub_processes.notes IS '備考';

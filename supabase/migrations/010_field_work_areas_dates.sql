-- field_work_areasテーブルに日程カラムを追加
ALTER TABLE field_work_areas
ADD COLUMN planned_start DATE,
ADD COLUMN planned_end DATE,
ADD COLUMN actual_start DATE,
ADD COLUMN actual_end DATE;

-- コメント追加
COMMENT ON COLUMN field_work_areas.planned_start IS '着工予定日';
COMMENT ON COLUMN field_work_areas.planned_end IS '完了予定日';
COMMENT ON COLUMN field_work_areas.actual_start IS '着工日（実績）';
COMMENT ON COLUMN field_work_areas.actual_end IS '完了日（実績）';

-- RLSポリシーの追加
-- 開発段階では全ての操作を許可

-- farmersテーブル
CREATE POLICY "農家の追加を許可" ON farmers FOR INSERT WITH CHECK (true);
CREATE POLICY "農家の閲覧を許可" ON farmers FOR SELECT USING (true);
CREATE POLICY "農家の更新を許可" ON farmers FOR UPDATE USING (true);
CREATE POLICY "農家の削除を許可" ON farmers FOR DELETE USING (true);

-- fieldsテーブル
CREATE POLICY "圃場の追加を許可" ON fields FOR INSERT WITH CHECK (true);
CREATE POLICY "圃場の閲覧を許可" ON fields FOR SELECT USING (true);
CREATE POLICY "圃場の更新を許可" ON fields FOR UPDATE USING (true);
CREATE POLICY "圃場の削除を許可" ON fields FOR DELETE USING (true);

-- project_fieldsテーブル
CREATE POLICY "工事圃場の追加を許可" ON project_fields FOR INSERT WITH CHECK (true);
CREATE POLICY "工事圃場の閲覧を許可" ON project_fields FOR SELECT USING (true);
CREATE POLICY "工事圃場の更新を許可" ON project_fields FOR UPDATE USING (true);
CREATE POLICY "工事圃場の削除を許可" ON project_fields FOR DELETE USING (true);

-- field_work_assignmentsテーブル
CREATE POLICY "作業割当の追加を許可" ON field_work_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "作業割当の閲覧を許可" ON field_work_assignments FOR SELECT USING (true);
CREATE POLICY "作業割当の更新を許可" ON field_work_assignments FOR UPDATE USING (true);
CREATE POLICY "作業割当の削除を許可" ON field_work_assignments FOR DELETE USING (true);

-- projectsテーブル（既存のSELECTポリシーに加えて）
CREATE POLICY "工事の追加を許可" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "工事の更新を許可" ON projects FOR UPDATE USING (true);
CREATE POLICY "工事の削除を許可" ON projects FOR DELETE USING (true);

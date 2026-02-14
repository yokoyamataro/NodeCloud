-- projectsテーブルのRLSポリシー追加
-- 現時点では全ユーザーがCRUD可能にする（認証機能実装後に制限を追加）

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "工事参加者のみ閲覧可" ON projects;
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

-- 全ユーザーが工事を閲覧可能
CREATE POLICY "projects_select_policy" ON projects
FOR SELECT USING (true);

-- 全ユーザーが工事を追加可能
CREATE POLICY "projects_insert_policy" ON projects
FOR INSERT WITH CHECK (true);

-- 全ユーザーが工事を更新可能
CREATE POLICY "projects_update_policy" ON projects
FOR UPDATE USING (true) WITH CHECK (true);

-- 全ユーザーが工事を削除可能
CREATE POLICY "projects_delete_policy" ON projects
FOR DELETE USING (true);

-- 初期プロジェクトの作成
-- アプリ起動時に最低1つのプロジェクトが存在することを保証

INSERT INTO projects (id, name, description, status, start_date, end_date)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'サンプル工事',
    '初期サンプルプロジェクトです',
    'active',
    '2024-04-01',
    '2024-12-31'
)
ON CONFLICT (id) DO NOTHING;

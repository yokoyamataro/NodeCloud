-- 農業土木工事 施工管理支援アプリ 初期スキーマ
-- PostgreSQL + PostGIS

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 工事管理
-- ============================================

-- 工種マスタ
CREATE TABLE work_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    display_order   INT NOT NULL DEFAULT 0,
    color           TEXT,
    icon            TEXT
);

-- 初期データ
INSERT INTO work_types (code, name, display_order, color) VALUES
    ('underdrain',    '暗渠', 1, '#3B82F6'),
    ('soil_import',   '客土', 2, '#F59E0B'),
    ('subsoil_break', '心破', 3, '#EF4444'),
    ('soil_improve',  '土改', 4, '#10B981'),
    ('grading',       '整地', 5, '#8B5CF6'),
    ('open_ditch',    '明渠', 6, '#06B6D4');

-- 工事業者
CREATE TABLE companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    company_type    TEXT NOT NULL,
    specialty       TEXT,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザー（担当者）
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    email           TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'member',
    phone           TEXT,
    avatar_url      TEXT,
    auth_id         TEXT UNIQUE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 工事案件
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT,
    area_polygon    GEOMETRY(POLYGON, 4326),
    status          TEXT NOT NULL DEFAULT 'planned',
    start_date      DATE,
    end_date        DATE,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 圃場管理
-- ============================================

-- 農家
CREATE TABLE farmers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_number   INT NOT NULL,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    contact_info    JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, farmer_number)
);

-- 圃場
CREATE TABLE fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id       UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    field_number    INT NOT NULL,
    area_polygon    GEOMETRY(POLYGON, 4326),
    area_hectares   NUMERIC(10,4),
    soil_type       TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farmer_id, field_number)
);

-- 工事×圃場 紐付け
CREATE TABLE project_fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    field_id        UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, field_id)
);

-- ============================================
-- 3. 関係者管理
-- ============================================

-- 工事×業者
CREATE TABLE project_companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id      UUID NOT NULL REFERENCES companies(id),
    role            TEXT NOT NULL,
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, company_id)
);

-- 工事×担当者
CREATE TABLE project_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    project_role    TEXT DEFAULT 'member',
    is_active       BOOLEAN DEFAULT TRUE,
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- ============================================
-- 4. 進捗管理
-- ============================================

-- 圃場×工種 作業割当
CREATE TABLE field_work_assignments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_field_id    UUID NOT NULL REFERENCES project_fields(id) ON DELETE CASCADE,
    work_type_id        UUID NOT NULL REFERENCES work_types(id),
    assigned_company_id UUID REFERENCES project_companies(id),
    status              TEXT NOT NULL DEFAULT 'not_started',
    progress_pct        INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    planned_start       DATE,
    planned_end         DATE,
    actual_start        DATE,
    actual_end          DATE,
    estimated_hours     NUMERIC(8,2),
    actual_hours        NUMERIC(8,2) DEFAULT 0,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_field_id, work_type_id)
);

-- 工程スケジュール
CREATE TABLE schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES field_work_assignments(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    scheduled_date  DATE NOT NULL,
    duration_hours  NUMERIC(5,2),
    assigned_to     UUID REFERENCES users(id),
    status          TEXT DEFAULT 'scheduled',
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 日報
CREATE TABLE daily_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES field_work_assignments(id) ON DELETE CASCADE,
    reported_by     UUID NOT NULL REFERENCES users(id),
    report_date     DATE NOT NULL,
    hours_worked    NUMERIC(5,2) NOT NULL,
    workers_count   INT DEFAULT 1,
    equipment_used  JSONB,
    weather         TEXT,
    description     TEXT,
    photos          JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, reported_by, report_date)
);

-- ============================================
-- 5. コミュニケーション
-- ============================================

-- チャットチャンネル
CREATE TABLE chat_channels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    channel_type    TEXT NOT NULL,
    field_id        UUID REFERENCES fields(id),
    work_type_id    UUID REFERENCES work_types(id),
    name            TEXT NOT NULL,
    is_archived     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- チャンネル参加者
CREATE TABLE channel_members (
    channel_id      UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_id)
);

-- チャットメッセージ
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id      UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    reply_to_id     UUID REFERENCES chat_messages(id),
    is_pinned       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 添付ファイル
CREATE TABLE message_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    file_url        TEXT NOT NULL,
    file_type       TEXT,
    file_size       BIGINT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 既読管理
CREATE TABLE message_reads (
    channel_id      UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    last_read_at    TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (channel_id, user_id)
);

-- ============================================
-- 6. インデックス
-- ============================================

CREATE INDEX idx_farmers_project_number ON farmers(project_id, farmer_number);
CREATE INDEX idx_fields_farmer ON fields(farmer_id, field_number);
CREATE INDEX idx_projects_area ON projects USING GIST(area_polygon);
CREATE INDEX idx_fields_area ON fields USING GIST(area_polygon);
CREATE INDEX idx_assignments_status ON field_work_assignments(status);
CREATE INDEX idx_assignments_dates ON field_work_assignments(planned_start, planned_end);
CREATE INDEX idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);
CREATE INDEX idx_messages_channel_time ON chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_sender ON chat_messages(sender_id);

-- ============================================
-- 7. RLS（Row Level Security）
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_work_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 工事参加者のみ閲覧可能
CREATE POLICY "工事参加者のみ閲覧可" ON projects FOR SELECT
USING (
    id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.uid() AND is_active = TRUE
    )
);

-- チャンネル参加者のみメッセージ閲覧可能
CREATE POLICY "チャンネル参加者のみ閲覧可" ON chat_messages FOR SELECT
USING (
    channel_id IN (
        SELECT channel_id FROM channel_members
        WHERE user_id = auth.uid()
    )
);

-- ============================================
-- 8. トリガー（updated_at自動更新）
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON field_work_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

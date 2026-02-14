# 農業土木工事 施工管理支援アプリ DB設計

## 概要

北海道の農業土木工事（暗渠・客土・心破・土改・整地・明渠等）の施工管理を支援するアプリケーションのデータベース設計。工事業者間の情報共有（チャット）、圃場・工種別の進捗管理、カレンダーによる工数管理を実現する。

---

## 1. エンティティ一覧

| 領域 | テーブル名 | 説明 |
|------|-----------|------|
| 工事管理 | projects | 工事案件 |
| 工事管理 | work_types | 工種マスタ |
| 圃場管理 | farmers | 農家 |
| 圃場管理 | fields | 圃場（農家番号-圃場番号） |
| 圃場管理 | project_fields | 工事×圃場の紐付け |
| 圃場管理 | field_work_assignments | 圃場×工種の作業割当 |
| 関係者管理 | companies | 工事業者（元請・下請） |
| 関係者管理 | users | 担当者（各業者の社員） |
| 関係者管理 | project_companies | 工事×業者の参加情報 |
| 関係者管理 | project_members | 工事×担当者の参加情報 |
| 進捗管理 | schedules | 工程スケジュール |
| 進捗管理 | daily_reports | 日報（工数記録） |
| コミュニケーション | chat_channels | チャットチャンネル（圃場×工種） |
| コミュニケーション | chat_messages | チャットメッセージ |
| コミュニケーション | message_attachments | 添付ファイル |
| コミュニケーション | message_reads | 既読管理 |

---

## 2. テーブル定義

### 2.1 工事管理

#### projects（工事案件）
```sql
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,                    -- 工事名称
    description     TEXT,                             -- 工事概要
    area_polygon    GEOMETRY(POLYGON, 4326),          -- 工事区域ポリゴン（PostGIS）
    status          TEXT NOT NULL DEFAULT 'planned',  -- planned/active/completed/suspended
    start_date      DATE,                             -- 着工予定日
    end_date        DATE,                             -- 竣工予定日
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### work_types（工種マスタ）
```sql
CREATE TABLE work_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT UNIQUE NOT NULL,    -- 'underdrain','soil_import','subsoil_break','soil_improve','grading','open_ditch'
    name            TEXT NOT NULL,           -- 暗渠, 客土, 心破, 土改, 整地, 明渠
    display_order   INT NOT NULL DEFAULT 0,
    color           TEXT,                    -- UI表示用カラーコード
    icon            TEXT                     -- UI表示用アイコン名
);

-- 初期データ
INSERT INTO work_types (code, name, display_order) VALUES
    ('underdrain',    '暗渠', 1),
    ('soil_import',   '客土', 2),
    ('subsoil_break', '心破', 3),
    ('soil_improve',  '土改', 4),
    ('grading',       '整地', 5),
    ('open_ditch',    '明渠', 6);
```

### 2.2 圃場管理

#### farmers（農家）
```sql
CREATE TABLE farmers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_number   INT NOT NULL,                    -- 農家番号（工事内で一意）
    project_id      UUID NOT NULL REFERENCES projects(id),
    name            TEXT NOT NULL,                    -- 農家名
    contact_info    JSONB,                            -- 連絡先情報
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, farmer_number)
);
```

#### fields（圃場）
```sql
CREATE TABLE fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id       UUID NOT NULL REFERENCES farmers(id),
    field_number    INT NOT NULL,                     -- 圃場番号
    field_label     TEXT GENERATED ALWAYS AS (         -- 自動生成ラベル "1-1"
        -- トリガーで生成する方が柔軟
    ) STORED,
    area_polygon    GEOMETRY(POLYGON, 4326),          -- 圃場ポリゴン（PostGIS）
    area_hectares   NUMERIC(10,4),                    -- 面積（ha）
    soil_type       TEXT,                             -- 土質
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(farmer_id, field_number)
);
```

> **補足**: `field_label`（例: "1-1"）はアプリ側で `farmer_number || '-' || field_number` として生成するか、ビュー/関数で対応する。

#### project_fields（工事×圃場 紐付け）
```sql
CREATE TABLE project_fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    field_id        UUID NOT NULL REFERENCES fields(id),
    status          TEXT NOT NULL DEFAULT 'pending',  -- pending/in_progress/completed
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, field_id)
);
```

#### field_work_assignments（圃場×工種 作業割当）
```sql
CREATE TABLE field_work_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_field_id UUID NOT NULL REFERENCES project_fields(id),
    work_type_id    UUID NOT NULL REFERENCES work_types(id),
    assigned_company_id UUID REFERENCES project_companies(id),  -- 担当業者
    status          TEXT NOT NULL DEFAULT 'not_started',
                    -- not_started / in_progress / completed / on_hold
    progress_pct    INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    planned_start   DATE,
    planned_end     DATE,
    actual_start    DATE,
    actual_end      DATE,
    estimated_hours NUMERIC(8,2),           -- 見積工数
    actual_hours    NUMERIC(8,2) DEFAULT 0, -- 実績工数
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_field_id, work_type_id)
);
```

### 2.3 関係者管理

#### companies（工事業者）
```sql
CREATE TABLE companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    company_type    TEXT NOT NULL,           -- prime_contractor / subcontractor
    specialty       TEXT,                    -- surveying/excavation/transport/grading/general
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### users（担当者）
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    email           TEXT UNIQUE NOT NULL,
    name            TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'member',  -- admin/manager/member
    phone           TEXT,
    avatar_url      TEXT,
    auth_id         TEXT UNIQUE,             -- Supabase Auth連携用
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### project_companies（工事×業者）
```sql
CREATE TABLE project_companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    company_id      UUID NOT NULL REFERENCES companies(id),
    role            TEXT NOT NULL,           -- prime_contractor / sub_surveying / sub_excavation / sub_transport / sub_grading
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, company_id)
);
```

#### project_members（工事×担当者）
```sql
CREATE TABLE project_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    project_role    TEXT DEFAULT 'member',   -- director/supervisor/member
    is_active       BOOLEAN DEFAULT TRUE,
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);
```

### 2.4 進捗管理

#### schedules（工程スケジュール）
```sql
CREATE TABLE schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES field_work_assignments(id),
    title           TEXT NOT NULL,
    scheduled_date  DATE NOT NULL,
    duration_hours  NUMERIC(5,2),
    assigned_to     UUID REFERENCES users(id),
    status          TEXT DEFAULT 'scheduled', -- scheduled/completed/cancelled
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### daily_reports（日報・工数記録）
```sql
CREATE TABLE daily_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES field_work_assignments(id),
    reported_by     UUID NOT NULL REFERENCES users(id),
    report_date     DATE NOT NULL,
    hours_worked    NUMERIC(5,2) NOT NULL,
    workers_count   INT DEFAULT 1,           -- 作業員数
    equipment_used  JSONB,                   -- 使用機械
    weather         TEXT,                    -- 天候
    description     TEXT,                    -- 作業内容
    photos          JSONB,                   -- 写真URL配列
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assignment_id, reported_by, report_date)
);
```

### 2.5 コミュニケーション

#### chat_channels（チャットチャンネル）
```sql
CREATE TABLE chat_channels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id),
    channel_type    TEXT NOT NULL,
    -- 'project'       = 工事全体
    -- 'field'         = 圃場単位
    -- 'work_type'     = 工種単位
    -- 'field_work'    = 圃場×工種
    -- 'direct'        = ダイレクトメッセージ
    field_id        UUID REFERENCES fields(id),         -- 圃場指定時
    work_type_id    UUID REFERENCES work_types(id),     -- 工種指定時
    name            TEXT NOT NULL,                      -- チャンネル名
    is_archived     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- チャンネル参加者
CREATE TABLE channel_members (
    channel_id      UUID NOT NULL REFERENCES chat_channels(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    joined_at       TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (channel_id, user_id)
);
```

#### chat_messages（チャットメッセージ）
```sql
CREATE TABLE chat_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id      UUID NOT NULL REFERENCES chat_channels(id),
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    reply_to_id     UUID REFERENCES chat_messages(id),  -- リプライ
    is_pinned       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### message_attachments（添付ファイル）
```sql
CREATE TABLE message_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id      UUID NOT NULL REFERENCES chat_messages(id),
    file_name       TEXT NOT NULL,
    file_url        TEXT NOT NULL,           -- Supabase Storage URL
    file_type       TEXT,                    -- image/pdf/dwg/etc
    file_size       BIGINT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### message_reads（既読管理）
```sql
CREATE TABLE message_reads (
    channel_id      UUID NOT NULL REFERENCES chat_channels(id),
    user_id         UUID NOT NULL REFERENCES users(id),
    last_read_at    TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (channel_id, user_id)
);
```

---

## 3. インデックス設計

```sql
-- 圃場検索（農家番号・圃場番号）
CREATE INDEX idx_farmers_project_number ON farmers(project_id, farmer_number);
CREATE INDEX idx_fields_farmer ON fields(farmer_id, field_number);

-- 空間インデックス（PostGIS）
CREATE INDEX idx_projects_area ON projects USING GIST(area_polygon);
CREATE INDEX idx_fields_area ON fields USING GIST(area_polygon);

-- 進捗管理
CREATE INDEX idx_assignments_status ON field_work_assignments(status);
CREATE INDEX idx_assignments_dates ON field_work_assignments(planned_start, planned_end);
CREATE INDEX idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date);

-- チャット
CREATE INDEX idx_messages_channel_time ON chat_messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_sender ON chat_messages(sender_id);
```

---

## 4. RLS（Row Level Security）ポリシー概要

Supabase RLSで工事参加者のみがデータにアクセスできるよう制御する。

```sql
-- 基本方針: project_membersに登録されたユーザーのみ当該工事データにアクセス可能
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "工事参加者のみ閲覧可"
ON projects FOR SELECT
USING (
    id IN (
        SELECT project_id FROM project_members
        WHERE user_id = auth.uid() AND is_active = TRUE
    )
);

-- チャットメッセージ: チャンネル参加者のみ
CREATE POLICY "チャンネル参加者のみ閲覧可"
ON chat_messages FOR SELECT
USING (
    channel_id IN (
        SELECT channel_id FROM channel_members
        WHERE user_id = auth.uid()
    )
);
```

---

## 5. ER図（リレーション概要）

```
projects ─────┬──── project_companies ──── companies
              │                                │
              │                              users
              │                                │
              ├──── project_members ────────────┘
              │
              ├──── farmers
              │       └──── fields
              │               │
              ├──── project_fields
              │       │
              │       └──── field_work_assignments ──── work_types
              │               │
              │               ├──── schedules
              │               └──── daily_reports
              │
              └──── chat_channels
                      ├──── channel_members
                      └──── chat_messages
                              ├──── message_attachments
                              └──── message_reads
```

---

## 6. 技術スタック推奨

| レイヤー | 技術 |
|---------|------|
| DB | PostgreSQL + PostGIS（Supabase） |
| 認証 | Supabase Auth |
| リアルタイム | Supabase Realtime（チャット） |
| ストレージ | Supabase Storage（写真・添付ファイル） |
| フロント | Flutter（モバイル）/ React（Web管理画面） |
| 地図 | Mapbox GL JS or Google Maps API |

---

## 7. 拡張ポイント

- **通知テーブル**: プッシュ通知・アプリ内通知用
- **ファイル管理テーブル**: 図面・工事写真の版管理
- **承認ワークフロー**: 日報・工程変更の承認フロー
- **機械管理テーブル**: 重機・車両の配車管理
- **積算テーブル**: 数量・金額の管理

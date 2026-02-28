// db_design.mdに基づく型定義

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ステータス型
export type ProjectStatus = 'planned' | 'active' | 'completed' | 'suspended'
export type FieldWorkStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold'
export type ProjectFieldStatus = 'pending' | 'in_progress' | 'completed'
export type CompanyType = 'prime_contractor' | 'subcontractor'
export type CompanyRole = 'prime_contractor' | 'sub_surveying' | 'sub_excavation' | 'sub_transport' | 'sub_grading'
export type UserRole = 'admin' | 'manager' | 'member'
export type ProjectMemberRole = 'director' | 'supervisor' | 'member'
export type ChannelType = 'project' | 'field' | 'work_type' | 'field_work' | 'direct'
export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled'

// 工種コード
export type WorkTypeCode = 'underdrain' | 'soil_import' | 'subsoil_break' | 'soil_improve' | 'grading' | 'open_ditch'

// 工種マスタの表示名
export const WORK_TYPE_NAMES: Record<WorkTypeCode, string> = {
  underdrain: '暗渠',
  soil_import: '客土',
  subsoil_break: '心破',
  soil_improve: '土改',
  grading: '整地',
  open_ditch: '明渠',
}

// テーブル型定義
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          area_polygon: Json | null
          status: ProjectStatus
          start_date: string | null
          end_date: string | null
          fiscal_year: number | null
          project_number: string | null
          client_name: string | null
          contractor_name: string | null
          coordinate_system: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      work_types: {
        Row: {
          id: string
          code: WorkTypeCode
          name: string
          display_order: number
          color: string | null
          icon: string | null
        }
        Insert: Omit<Database['public']['Tables']['work_types']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['work_types']['Insert']>
      }
      farmers: {
        Row: {
          id: string
          farmer_number: number
          project_id: string
          name: string
          contact_info: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['farmers']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['farmers']['Insert']>
      }
      fields: {
        Row: {
          id: string
          farmer_id: string
          field_number: string
          area_polygon: Json | null
          area_hectares: number | null
          soil_type: string | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['fields']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['fields']['Insert']>
      }
      project_fields: {
        Row: {
          id: string
          project_id: string
          field_id: string
          status: ProjectFieldStatus
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_fields']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['project_fields']['Insert']>
      }
      field_work_assignments: {
        Row: {
          id: string
          project_field_id: string
          work_type_id: string
          assigned_company_id: string | null
          status: FieldWorkStatus
          progress_pct: number
          planned_start: string | null
          planned_end: string | null
          actual_start: string | null
          actual_end: string | null
          estimated_hours: number | null
          actual_hours: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['field_work_assignments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['field_work_assignments']['Insert']>
      }
      companies: {
        Row: {
          id: string
          name: string
          company_type: CompanyType
          specialty: string | null
          phone: string | null
          email: string | null
          address: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      users: {
        Row: {
          id: string
          company_id: string
          email: string
          name: string
          role: UserRole
          phone: string | null
          avatar_url: string | null
          auth_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      project_companies: {
        Row: {
          id: string
          project_id: string
          company_id: string
          role: CompanyRole
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_companies']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['project_companies']['Insert']>
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          project_role: ProjectMemberRole
          is_active: boolean
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['project_members']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['project_members']['Insert']>
      }
      schedules: {
        Row: {
          id: string
          assignment_id: string
          title: string
          scheduled_date: string
          duration_hours: number | null
          assigned_to: string | null
          status: ScheduleStatus
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['schedules']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['schedules']['Insert']>
      }
      daily_reports: {
        Row: {
          id: string
          assignment_id: string
          reported_by: string
          report_date: string
          hours_worked: number
          workers_count: number
          equipment_used: Json | null
          weather: string | null
          description: string | null
          photos: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['daily_reports']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['daily_reports']['Insert']>
      }
      chat_channels: {
        Row: {
          id: string
          project_id: string
          channel_type: ChannelType
          field_id: string | null
          work_type_id: string | null
          name: string
          is_archived: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_channels']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_channels']['Insert']>
      }
      channel_members: {
        Row: {
          channel_id: string
          user_id: string
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['channel_members']['Row'], 'joined_at'>
        Update: Partial<Database['public']['Tables']['channel_members']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          channel_id: string
          sender_id: string
          content: string
          reply_to_id: string | null
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
      message_attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_url: string
          file_type: string | null
          file_size: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['message_attachments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['message_attachments']['Insert']>
      }
      message_reads: {
        Row: {
          channel_id: string
          user_id: string
          last_read_at: string
        }
        Insert: Database['public']['Tables']['message_reads']['Row']
        Update: Partial<Database['public']['Tables']['message_reads']['Insert']>
      }
    }
  }
}

// 便利な型エイリアス
export type Project = Database['public']['Tables']['projects']['Row']
export type WorkType = Database['public']['Tables']['work_types']['Row']
export type Farmer = Database['public']['Tables']['farmers']['Row']
export type Field = Database['public']['Tables']['fields']['Row']
export type ProjectField = Database['public']['Tables']['project_fields']['Row']
export type FieldWorkAssignment = Database['public']['Tables']['field_work_assignments']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type ProjectCompany = Database['public']['Tables']['project_companies']['Row']
export type ProjectMember = Database['public']['Tables']['project_members']['Row']
export type Schedule = Database['public']['Tables']['schedules']['Row']
export type DailyReport = Database['public']['Tables']['daily_reports']['Row']
export type ChatChannel = Database['public']['Tables']['chat_channels']['Row']
export type ChannelMember = Database['public']['Tables']['channel_members']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type MessageAttachment = Database['public']['Tables']['message_attachments']['Row']
export type MessageRead = Database['public']['Tables']['message_reads']['Row']

// 結合型（フロントエンド用）
export interface FieldWithFarmer extends Field {
  farmer: Farmer
}

export interface FieldWorkAssignmentWithDetails extends FieldWorkAssignment {
  work_type: WorkType
  assigned_company?: Company
}

export interface ProjectFieldWithDetails extends ProjectField {
  field: FieldWithFarmer
  assignments: FieldWorkAssignmentWithDetails[]
}

export interface ChatMessageWithSender extends ChatMessage {
  sender: User
  attachments?: MessageAttachment[]
}

export interface ChatChannelWithDetails extends ChatChannel {
  field?: Field
  work_type?: WorkType
  unread_count?: number
}

// 圃場×工種ごとの面積・日程
export interface FieldWorkArea {
  id: string
  field_id: string
  work_type_id: string
  area_hectares: number
  notes: string | null
  planned_start: string | null
  planned_end: string | null
  actual_start: string | null
  actual_end: string | null
  created_at: string
  updated_at: string
}

// 作付けマスタ
export interface CropType {
  id: string
  name: string
  display_order: number
  is_default: boolean
  created_at: string
}

// 圃場の作付け
export interface FieldCrop {
  id: string
  field_id: string
  crop_type_id: string
  fiscal_year: number | null
  area_hectares: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 結合型
export interface FieldWorkAreaWithWorkType extends FieldWorkArea {
  work_type: WorkType
}

export interface FieldCropWithCropType extends FieldCrop {
  crop_type: CropType
}

// 工事に紐づく協力業者（結合型）
export interface ProjectCompanyWithDetails extends ProjectCompany {
  company: Company
}

// 細部工程（工種のサブ工程）
export interface WorkAreaSubProcess {
  id: string
  field_work_area_id: string
  name: string
  display_order: number
  planned_start: string | null
  planned_end: string | null
  actual_start: string | null
  actual_end: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 工種面積と細部工程を含む結合型
export interface FieldWorkAreaWithDetails extends FieldWorkArea {
  work_type: WorkType
  sub_processes: WorkAreaSubProcess[]
}

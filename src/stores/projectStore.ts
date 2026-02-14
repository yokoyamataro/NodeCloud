import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectFieldWithDetails, WorkType } from '@/types/database'

// デモ用データ
const demoProjects: Project[] = [
  {
    id: 'project-1',
    name: '令和6年度 空知地区農地整備事業',
    description: '空知地区における暗渠排水・客土工事',
    area_polygon: null,
    status: 'active',
    start_date: '2024-04-01',
    end_date: '2024-11-30',
    created_by: 'demo-user-id',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
  {
    id: 'project-2',
    name: '令和6年度 十勝地区圃場整備事業',
    description: '十勝地区における圃場整備・明渠工事',
    area_polygon: null,
    status: 'planned',
    start_date: '2024-06-01',
    end_date: '2025-03-31',
    created_by: 'demo-user-id',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
  },
  {
    id: 'project-3',
    name: '令和5年度 上川地区土壌改良事業',
    description: '上川地区における土壌改良・心土破砕工事',
    area_polygon: null,
    status: 'completed',
    start_date: '2023-05-01',
    end_date: '2023-12-15',
    created_by: 'demo-user-id',
    created_at: '2023-04-01T00:00:00Z',
    updated_at: '2023-12-15T00:00:00Z',
  },
]

const demoWorkTypes: WorkType[] = [
  { id: 'wt-1', code: 'underdrain', name: '暗渠', display_order: 1, color: '#3B82F6', icon: null },
  { id: 'wt-2', code: 'soil_import', name: '客土', display_order: 2, color: '#F59E0B', icon: null },
  { id: 'wt-3', code: 'subsoil_break', name: '心破', display_order: 3, color: '#EF4444', icon: null },
  { id: 'wt-4', code: 'soil_improve', name: '土改', display_order: 4, color: '#10B981', icon: null },
  { id: 'wt-5', code: 'grading', name: '整地', display_order: 5, color: '#8B5CF6', icon: null },
  { id: 'wt-6', code: 'open_ditch', name: '明渠', display_order: 6, color: '#06B6D4', icon: null },
]

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  projectFields: ProjectFieldWithDetails[]
  workTypes: WorkType[]
  isLoading: boolean
  error: string | null
  fetchProjects: () => Promise<void>
  fetchProject: (id: string) => Promise<void>
  fetchProjectFields: (projectId: string) => Promise<void>
  fetchWorkTypes: () => Promise<void>
  setCurrentProject: (project: Project | null) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  projectFields: [],
  workTypes: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        set({ projects: demoProjects, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ projects: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        const project = demoProjects.find(p => p.id === id) || null
        set({ currentProject: project, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentProject: data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchProjectFields: async (projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // デモモード: モックデータ
        const mockFields: ProjectFieldWithDetails[] = [
          {
            id: 'pf-1',
            project_id: projectId,
            field_id: 'field-1',
            status: 'in_progress',
            created_at: '2024-04-01T00:00:00Z',
            field: {
              id: 'field-1',
              farmer_id: 'farmer-1',
              field_number: 1,
              area_polygon: null,
              area_hectares: 2.5,
              soil_type: '黒ボク土',
              notes: null,
              created_at: '2024-03-01T00:00:00Z',
              farmer: {
                id: 'farmer-1',
                farmer_number: 1,
                project_id: projectId,
                name: '山田農場',
                contact_info: null,
                created_at: '2024-03-01T00:00:00Z',
              },
            },
            assignments: [
              {
                id: 'fwa-1',
                project_field_id: 'pf-1',
                work_type_id: 'wt-1',
                assigned_company_id: null,
                status: 'completed',
                progress_pct: 100,
                planned_start: '2024-04-01',
                planned_end: '2024-04-15',
                actual_start: '2024-04-01',
                actual_end: '2024-04-14',
                estimated_hours: 40,
                actual_hours: 38,
                notes: null,
                created_at: '2024-04-01T00:00:00Z',
                updated_at: '2024-04-14T00:00:00Z',
                work_type: demoWorkTypes[0],
              },
              {
                id: 'fwa-2',
                project_field_id: 'pf-1',
                work_type_id: 'wt-2',
                assigned_company_id: null,
                status: 'in_progress',
                progress_pct: 60,
                planned_start: '2024-04-16',
                planned_end: '2024-05-10',
                actual_start: '2024-04-16',
                actual_end: null,
                estimated_hours: 80,
                actual_hours: 48,
                notes: null,
                created_at: '2024-04-01T00:00:00Z',
                updated_at: '2024-05-01T00:00:00Z',
                work_type: demoWorkTypes[1],
              },
            ],
          },
          {
            id: 'pf-2',
            project_id: projectId,
            field_id: 'field-2',
            status: 'in_progress',
            created_at: '2024-04-01T00:00:00Z',
            field: {
              id: 'field-2',
              farmer_id: 'farmer-1',
              field_number: 2,
              area_polygon: null,
              area_hectares: 3.2,
              soil_type: '黒ボク土',
              notes: null,
              created_at: '2024-03-01T00:00:00Z',
              farmer: {
                id: 'farmer-1',
                farmer_number: 1,
                project_id: projectId,
                name: '山田農場',
                contact_info: null,
                created_at: '2024-03-01T00:00:00Z',
              },
            },
            assignments: [
              {
                id: 'fwa-3',
                project_field_id: 'pf-2',
                work_type_id: 'wt-3',
                assigned_company_id: null,
                status: 'in_progress',
                progress_pct: 30,
                planned_start: '2024-04-20',
                planned_end: '2024-05-20',
                actual_start: '2024-04-22',
                actual_end: null,
                estimated_hours: 60,
                actual_hours: 18,
                notes: null,
                created_at: '2024-04-01T00:00:00Z',
                updated_at: '2024-05-01T00:00:00Z',
                work_type: demoWorkTypes[2],
              },
            ],
          },
          {
            id: 'pf-3',
            project_id: projectId,
            field_id: 'field-3',
            status: 'pending',
            created_at: '2024-04-01T00:00:00Z',
            field: {
              id: 'field-3',
              farmer_id: 'farmer-2',
              field_number: 1,
              area_polygon: null,
              area_hectares: 1.8,
              soil_type: '沖積土',
              notes: null,
              created_at: '2024-03-01T00:00:00Z',
              farmer: {
                id: 'farmer-2',
                farmer_number: 2,
                project_id: projectId,
                name: '鈴木牧場',
                contact_info: null,
                created_at: '2024-03-01T00:00:00Z',
              },
            },
            assignments: [
              {
                id: 'fwa-4',
                project_field_id: 'pf-3',
                work_type_id: 'wt-5',
                assigned_company_id: null,
                status: 'not_started',
                progress_pct: 0,
                planned_start: '2024-06-01',
                planned_end: '2024-06-30',
                actual_start: null,
                actual_end: null,
                estimated_hours: 40,
                actual_hours: 0,
                notes: null,
                created_at: '2024-04-01T00:00:00Z',
                updated_at: '2024-04-01T00:00:00Z',
                work_type: demoWorkTypes[4],
              },
            ],
          },
        ]
        set({ projectFields: mockFields, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('project_fields')
        .select(`
          *,
          field:fields(
            *,
            farmer:farmers(*)
          ),
          assignments:field_work_assignments(
            *,
            work_type:work_types(*)
          )
        `)
        .eq('project_id', projectId)

      if (error) throw error
      set({ projectFields: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchWorkTypes: async () => {
    set({ isLoading: true, error: null })
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        set({ workTypes: demoWorkTypes, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('work_types')
        .select('*')
        .order('display_order')

      if (error) throw error
      set({ workTypes: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project })
  },
}))

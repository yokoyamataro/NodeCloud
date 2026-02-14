import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Project, ProjectFieldWithDetails, WorkType } from '@/types/database'

// デモモードの判定
const isDemoMode = () => !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEMO_MODE === 'true'

// デモ用データ（空配列 - サンプル工事は削除済み）
const demoProjects: Project[] = []

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
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<Project>
  updateProject: (id: string, project: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  projectFields: [],
  workTypes: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        set({ projects: demoProjects, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('fiscal_year', { ascending: false })
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
      if (isDemoMode()) {
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
      if (isDemoMode()) {
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
      if (isDemoMode()) {
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

  createProject: async (projectData) => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        const newProject: Project = {
          ...projectData,
          id: `project-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        set((state) => ({
          projects: [...state.projects, newProject],
          isLoading: false,
        }))
        return newProject
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          area_polygon: projectData.area_polygon,
          status: projectData.status,
          start_date: projectData.start_date,
          end_date: projectData.end_date,
          fiscal_year: projectData.fiscal_year,
          project_number: projectData.project_number,
          client_name: projectData.client_name,
          contractor_name: projectData.contractor_name,
          coordinate_system: projectData.coordinate_system,
          created_by: projectData.created_by,
        })
        .select()
        .single()

      if (error) throw error

      // 工事一覧を再取得
      await get().fetchProjects()

      return data
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateProject: async (id, projectData) => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...projectData, updated_at: new Date().toISOString() } : p
          ),
          currentProject: state.currentProject?.id === id
            ? { ...state.currentProject, ...projectData, updated_at: new Date().toISOString() }
            : state.currentProject,
          isLoading: false,
        }))
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? data : p)),
        currentProject: state.currentProject?.id === id ? data : state.currentProject,
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase.from('projects').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },
}))

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Field, Farmer, FieldWithFarmer, ProjectFieldWithDetails, WorkType } from '@/types/database'

// デモモードの判定（環境変数が設定されていない場合はデモモード）
const isDemoMode = () => !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEMO_MODE === 'true'

// デモ用の工種データ
const mockWorkTypes: WorkType[] = [
  { id: 'wt-1', code: 'underdrain', name: '暗渠', display_order: 1, color: '#3B82F6', icon: null },
  { id: 'wt-2', code: 'soil_import', name: '客土', display_order: 2, color: '#F59E0B', icon: null },
  { id: 'wt-3', code: 'subsoil_break', name: '心破', display_order: 3, color: '#EF4444', icon: null },
  { id: 'wt-4', code: 'soil_improve', name: '土改', display_order: 4, color: '#8B5CF6', icon: null },
  { id: 'wt-5', code: 'grading', name: '整地', display_order: 5, color: '#10B981', icon: null },
  { id: 'wt-6', code: 'open_ditch', name: '明渠', display_order: 6, color: '#06B6D4', icon: null },
]

// デモ用の農家データ
const mockFarmers: Farmer[] = [
  {
    id: 'farmer-1',
    farmer_number: 1,
    project_id: 'project-1',
    name: '山田農場',
    contact_info: { phone: '0166-12-3456', address: '旭川市西神楽1条1丁目' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'farmer-2',
    farmer_number: 2,
    project_id: 'project-1',
    name: '鈴木牧場',
    contact_info: { phone: '0166-22-3456', address: '旭川市東神楽2条3丁目' },
    created_at: new Date().toISOString(),
  },
  {
    id: 'farmer-3',
    farmer_number: 3,
    project_id: 'project-1',
    name: '佐藤ファーム',
    contact_info: { phone: '0166-33-4567', address: '旭川市東旭川町' },
    created_at: new Date().toISOString(),
  },
]

// デモ用の圃場データ
const mockFields: FieldWithFarmer[] = [
  {
    id: 'field-1',
    farmer_id: 'farmer-1',
    field_number: 1,
    area_polygon: {
      type: 'Polygon',
      coordinates: [[
        [142.95, 43.05],
        [142.96, 43.05],
        [142.96, 43.04],
        [142.95, 43.04],
        [142.95, 43.05],
      ]],
    },
    area_hectares: 3.5,
    soil_type: '黒ボク土',
    notes: '水はけ良好',
    created_at: new Date().toISOString(),
    farmer: mockFarmers[0],
  },
  {
    id: 'field-2',
    farmer_id: 'farmer-1',
    field_number: 2,
    area_polygon: {
      type: 'Polygon',
      coordinates: [[
        [142.96, 43.05],
        [142.97, 43.05],
        [142.97, 43.04],
        [142.96, 43.04],
        [142.96, 43.05],
      ]],
    },
    area_hectares: 2.8,
    soil_type: '褐色森林土',
    notes: null,
    created_at: new Date().toISOString(),
    farmer: mockFarmers[0],
  },
  {
    id: 'field-3',
    farmer_id: 'farmer-2',
    field_number: 1,
    area_polygon: {
      type: 'Polygon',
      coordinates: [[
        [142.95, 43.04],
        [142.96, 43.04],
        [142.96, 43.03],
        [142.95, 43.03],
        [142.95, 43.04],
      ]],
    },
    area_hectares: 4.2,
    soil_type: '黒ボク土',
    notes: '前年度暗渠施工済み',
    created_at: new Date().toISOString(),
    farmer: mockFarmers[1],
  },
  {
    id: 'field-4',
    farmer_id: 'farmer-2',
    field_number: 2,
    area_polygon: null,
    area_hectares: 5.0,
    soil_type: null,
    notes: 'ポリゴン未設定',
    created_at: new Date().toISOString(),
    farmer: mockFarmers[1],
  },
  {
    id: 'field-5',
    farmer_id: 'farmer-3',
    field_number: 1,
    area_polygon: null,
    area_hectares: 3.0,
    soil_type: '泥炭土',
    notes: null,
    created_at: new Date().toISOString(),
    farmer: mockFarmers[2],
  },
]

// デモ用のプロジェクト圃場詳細データ
const createMockProjectFields = (): ProjectFieldWithDetails[] => {
  return mockFields.map((field, index) => ({
    id: `pf-${field.id}`,
    project_id: 'project-1',
    field_id: field.id,
    status: index === 0 ? 'completed' : index === 1 ? 'in_progress' : 'pending',
    created_at: new Date().toISOString(),
    field: field,
    assignments: mockWorkTypes.slice(0, 3 + (index % 3)).map((wt, i) => ({
      id: `assign-${field.id}-${wt.id}`,
      project_field_id: `pf-${field.id}`,
      work_type_id: wt.id,
      assigned_company_id: i % 2 === 0 ? 'company-1' : 'company-2',
      status: i === 0 ? 'completed' : i === 1 ? 'in_progress' : 'not_started',
      progress_pct: i === 0 ? 100 : i === 1 ? 50 : 0,
      planned_start: '2024-05-01',
      planned_end: '2024-05-15',
      actual_start: i < 2 ? '2024-05-02' : null,
      actual_end: i === 0 ? '2024-05-14' : null,
      estimated_hours: 40,
      actual_hours: i === 0 ? 38 : i === 1 ? 20 : 0,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      work_type: wt,
      assigned_company: undefined,
    })),
  })) as ProjectFieldWithDetails[]
}

interface FieldState {
  fields: FieldWithFarmer[]
  farmers: Farmer[]
  projectFields: ProjectFieldWithDetails[]
  workTypes: WorkType[]
  selectedField: FieldWithFarmer | null
  isLoading: boolean
  error: string | null

  fetchFields: (projectId?: string) => Promise<void>
  fetchFarmers: (projectId?: string) => Promise<void>
  fetchProjectFields: (projectId: string) => Promise<void>
  getFieldById: (id: string) => FieldWithFarmer | undefined
  setSelectedField: (field: FieldWithFarmer | null) => void
  createField: (field: Omit<Field, 'id' | 'created_at'>, farmerId: string) => Promise<Field>
  updateField: (id: string, field: Partial<Field>) => Promise<void>
  updateFieldPolygon: (id: string, polygon: Field['area_polygon']) => Promise<void>
  deleteField: (id: string) => Promise<void>
  createFarmer: (farmer: Omit<Farmer, 'id' | 'created_at'>) => Promise<Farmer>
}

export const useFieldStore = create<FieldState>((set, get) => ({
  fields: [],
  farmers: [],
  projectFields: [],
  workTypes: mockWorkTypes,
  selectedField: null,
  isLoading: false,
  error: null,

  fetchFields: async (projectId?: string) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        set({ fields: mockFields, isLoading: false })
        return
      }

      let query = supabase
        .from('fields')
        .select('*, farmer:farmers(*)')
        .order('field_number')

      if (projectId) {
        query = query.eq('farmer.project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error
      set({ fields: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchFarmers: async (projectId?: string) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        const farmers = projectId
          ? mockFarmers.filter((f) => f.project_id === projectId)
          : mockFarmers
        set({ farmers, isLoading: false })
        return
      }

      let query = supabase
        .from('farmers')
        .select('*')
        .order('farmer_number')

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error
      set({ farmers: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchProjectFields: async (projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        set({ projectFields: createMockProjectFields(), isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('project_fields')
        .select(`
          *,
          field:fields(*, farmer:farmers(*)),
          assignments:field_work_assignments(*, work_type:work_types(*), assigned_company:companies(*))
        `)
        .eq('project_id', projectId)
        .order('created_at')

      if (error) throw error
      set({ projectFields: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  getFieldById: (id: string) => {
    return get().fields.find((f) => f.id === id)
  },

  setSelectedField: (field) => {
    set({ selectedField: field })
  },

  createField: async (fieldData, farmerId) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()
      const farmer = get().farmers.find((f) => f.id === farmerId)

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        const newField: FieldWithFarmer = {
          ...fieldData,
          id: `field-${Date.now()}`,
          farmer_id: farmerId,
          created_at: new Date().toISOString(),
          farmer: farmer!,
        }
        set((state) => ({
          fields: [...state.fields, newField],
          isLoading: false,
        }))
        return newField
      }

      const { data, error } = await supabase
        .from('fields')
        .insert({ ...fieldData, farmer_id: farmerId })
        .select('*, farmer:farmers(*)')
        .single()

      if (error) throw error

      set((state) => ({
        fields: [...state.fields, data],
        isLoading: false,
      }))
      return data
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateField: async (id, fieldData) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        set((state) => ({
          fields: state.fields.map((f) =>
            f.id === id ? { ...f, ...fieldData } : f
          ),
          selectedField: state.selectedField?.id === id
            ? { ...state.selectedField, ...fieldData }
            : state.selectedField,
          isLoading: false,
        }))
        return
      }

      const { data, error } = await supabase
        .from('fields')
        .update(fieldData)
        .eq('id', id)
        .select('*, farmer:farmers(*)')
        .single()

      if (error) throw error

      set((state) => ({
        fields: state.fields.map((f) =>
          f.id === id ? data : f
        ),
        selectedField: state.selectedField?.id === id ? data : state.selectedField,
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateFieldPolygon: async (id, polygon) => {
    await get().updateField(id, { area_polygon: polygon })
  },

  deleteField: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        set((state) => ({
          fields: state.fields.filter((f) => f.id !== id),
          selectedField: state.selectedField?.id === id ? null : state.selectedField,
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase.from('fields').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        fields: state.fields.filter((f) => f.id !== id),
        selectedField: state.selectedField?.id === id ? null : state.selectedField,
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  createFarmer: async (farmerData) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        const newFarmer: Farmer = {
          ...farmerData,
          id: `farmer-${Date.now()}`,
          created_at: new Date().toISOString(),
        }
        set((state) => ({
          farmers: [...state.farmers, newFarmer],
          isLoading: false,
        }))
        return newFarmer
      }

      const { data, error } = await supabase
        .from('farmers')
        .insert(farmerData)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        farmers: [...state.farmers, data],
        isLoading: false,
      }))
      return data
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },
}))

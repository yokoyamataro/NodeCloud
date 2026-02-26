import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Field, Farmer, FieldWithFarmer, ProjectFieldWithDetails, WorkType, FieldWorkArea, FieldWorkAreaWithWorkType, CropType, FieldCrop, FieldCropWithCropType, FieldWorkAssignment, FieldWorkAssignmentWithDetails } from '@/types/database'

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

// デモ用の作付けマスタ
const mockCropTypes: CropType[] = [
  { id: 'crop-1', name: '秋麦', display_order: 1, is_default: true, created_at: new Date().toISOString() },
  { id: 'crop-2', name: '春麦', display_order: 2, is_default: true, created_at: new Date().toISOString() },
  { id: 'crop-3', name: 'ビート', display_order: 3, is_default: true, created_at: new Date().toISOString() },
  { id: 'crop-4', name: 'いも', display_order: 4, is_default: true, created_at: new Date().toISOString() },
  { id: 'crop-5', name: '小豆', display_order: 5, is_default: true, created_at: new Date().toISOString() },
  { id: 'crop-6', name: '大豆', display_order: 6, is_default: true, created_at: new Date().toISOString() },
  { id: 'crop-7', name: 'ビール麦', display_order: 7, is_default: true, created_at: new Date().toISOString() },
  { id: 'crop-8', name: 'にんじん', display_order: 8, is_default: true, created_at: new Date().toISOString() },
  { id: 'crop-9', name: '玉ねぎ', display_order: 9, is_default: true, created_at: new Date().toISOString() },
  { id: 'crop-10', name: 'デントコーン', display_order: 10, is_default: true, created_at: new Date().toISOString() },
  { id: 'crop-11', name: '牧草', display_order: 11, is_default: true, created_at: new Date().toISOString() },
]

interface FieldState {
  fields: FieldWithFarmer[]
  farmers: Farmer[]
  projectFields: ProjectFieldWithDetails[]
  workTypes: WorkType[]
  cropTypes: CropType[]
  fieldWorkAreas: FieldWorkAreaWithWorkType[]
  fieldCrops: FieldCropWithCropType[]
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
  // 工種マスタ
  fetchWorkTypes: () => Promise<void>
  // 工種面積
  fetchFieldWorkAreas: (fieldId: string) => Promise<void>
  fetchAllFieldWorkAreas: (fieldIds: string[]) => Promise<void>
  createFieldWorkArea: (data: Omit<FieldWorkArea, 'id' | 'created_at' | 'updated_at'>) => Promise<FieldWorkArea>
  updateFieldWorkArea: (id: string, data: Partial<FieldWorkArea>) => Promise<void>
  deleteFieldWorkArea: (id: string) => Promise<void>
  // 作付けマスタ
  fetchCropTypes: () => Promise<void>
  createCropType: (name: string) => Promise<CropType>
  // 圃場作付け
  fetchFieldCrops: (fieldId: string) => Promise<void>
  fetchAllFieldCrops: (fieldIds: string[]) => Promise<void>
  createFieldCrop: (data: Omit<FieldCrop, 'id' | 'created_at' | 'updated_at'>) => Promise<FieldCrop>
  updateFieldCrop: (id: string, data: Partial<FieldCrop>) => Promise<void>
  deleteFieldCrop: (id: string) => Promise<void>
  // 工種割り当て（工程管理）
  createFieldWorkAssignment: (projectFieldId: string, data: Omit<FieldWorkAssignment, 'id' | 'project_field_id' | 'created_at' | 'updated_at'>) => Promise<FieldWorkAssignmentWithDetails>
  updateFieldWorkAssignment: (id: string, data: Partial<FieldWorkAssignment>) => Promise<void>
  deleteFieldWorkAssignment: (id: string) => Promise<void>
}

export const useFieldStore = create<FieldState>((set, get) => ({
  fields: [],
  farmers: [],
  projectFields: [],
  workTypes: [],
  cropTypes: [],
  fieldWorkAreas: [],
  fieldCrops: [],
  selectedField: null,
  isLoading: false,
  error: null,

  fetchFields: async (projectId?: string) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモードでもprojectIdでフィルタリング
        if (projectId) {
          const filteredFields = mockFields.filter(f => f.farmer.project_id === projectId)
          set({ fields: filteredFields, isLoading: false })
        } else {
          set({ fields: mockFields, isLoading: false })
        }
        return
      }

      if (projectId) {
        // プロジェクトIDでフィルタリングする場合、farmersテーブル経由で取得
        const { data: farmersData, error: farmersError } = await supabase
          .from('farmers')
          .select('id')
          .eq('project_id', projectId)

        if (farmersError) throw farmersError

        const farmerIds = farmersData?.map(f => f.id) || []

        if (farmerIds.length === 0) {
          set({ fields: [], isLoading: false })
          return
        }

        const { data, error } = await supabase
          .from('fields')
          .select('*, farmer:farmers(*)')
          .in('farmer_id', farmerIds)
          .order('field_number')

        if (error) {
          console.error('Error fetching fields:', error)
          throw error
        }
        console.log('Fetched fields for project:', projectId, data)
        // farmerがnullの場合を除外
        const validFields = (data || []).filter((f): f is FieldWithFarmer => f.farmer !== null)
        set({ fields: validFields, isLoading: false })
      } else {
        const { data, error } = await supabase
          .from('fields')
          .select('*, farmer:farmers(*)')
          .order('field_number')

        if (error) {
          console.error('Error fetching all fields:', error)
          throw error
        }
        console.log('Fetched all fields:', data)
        // farmerがnullの場合を除外
        const validFields = (data || []).filter((f): f is FieldWithFarmer => f.farmer !== null)
        set({ fields: validFields, isLoading: false })
      }
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

      if (useDemoMode) {
        const newFarmer: Farmer = {
          id: `farmer-${Date.now()}`,
          farmer_number: farmerData.farmer_number,
          project_id: farmerData.project_id,
          name: farmerData.name,
          contact_info: farmerData.contact_info || null,
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
        .insert({
          farmer_number: farmerData.farmer_number,
          project_id: farmerData.project_id,
          name: farmerData.name,
          contact_info: farmerData.contact_info || null,
        })
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

  // 工種マスタを取得
  fetchWorkTypes: async () => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        set({ workTypes: mockWorkTypes, isLoading: false })
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

  // 工種面積を取得
  fetchFieldWorkAreas: async (fieldId: string) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        // デモモードでは現在のfieldIdに一致するデータのみフィルタリング
        const currentAreas = get().fieldWorkAreas.filter(fwa => fwa.field_id === fieldId)
        set({ fieldWorkAreas: currentAreas, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('field_work_areas')
        .select('*, work_type:work_types(*)')
        .eq('field_id', fieldId)
        .order('created_at')

      if (error) throw error
      set({ fieldWorkAreas: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  // 全圃場の工種面積を一括取得
  fetchAllFieldWorkAreas: async (fieldIds: string[]) => {
    if (fieldIds.length === 0) {
      set({ fieldWorkAreas: [] })
      return
    }
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        // デモモードでは現在のfieldWorkAreasから該当fieldIdsのデータのみ保持
        const currentAreas = get().fieldWorkAreas.filter(fwa => fieldIds.includes(fwa.field_id))
        set({ fieldWorkAreas: currentAreas })
        return
      }
      set({ isLoading: true, error: null })

      const { data, error } = await supabase
        .from('field_work_areas')
        .select('*, work_type:work_types(*)')
        .in('field_id', fieldIds)
        .order('created_at')

      if (error) throw error
      set({ fieldWorkAreas: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  // 工種面積を追加
  createFieldWorkArea: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        const workType = mockWorkTypes.find(wt => wt.id === data.work_type_id)
        const newArea: FieldWorkAreaWithWorkType = {
          id: `fwa-${Date.now()}`,
          field_id: data.field_id,
          work_type_id: data.work_type_id,
          area_hectares: data.area_hectares,
          notes: data.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          work_type: workType!,
        }
        set((state) => ({
          fieldWorkAreas: [...state.fieldWorkAreas, newArea],
          isLoading: false,
        }))
        return newArea
      }

      const { data: result, error } = await supabase
        .from('field_work_areas')
        .insert({
          field_id: data.field_id,
          work_type_id: data.work_type_id,
          area_hectares: data.area_hectares,
          notes: data.notes,
        })
        .select('*, work_type:work_types(*)')
        .single()

      if (error) throw error

      set((state) => ({
        fieldWorkAreas: [...state.fieldWorkAreas, result],
        isLoading: false,
      }))
      return result
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  // 工種面積を更新
  updateFieldWorkArea: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        set((state) => ({
          fieldWorkAreas: state.fieldWorkAreas.map((fwa) =>
            fwa.id === id ? { ...fwa, ...data, updated_at: new Date().toISOString() } : fwa
          ),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase
        .from('field_work_areas')
        .update(data)
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        fieldWorkAreas: state.fieldWorkAreas.map((fwa) =>
          fwa.id === id ? { ...fwa, ...data, updated_at: new Date().toISOString() } : fwa
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  // 工種面積を削除
  deleteFieldWorkArea: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        set((state) => ({
          fieldWorkAreas: state.fieldWorkAreas.filter((fwa) => fwa.id !== id),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase.from('field_work_areas').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        fieldWorkAreas: state.fieldWorkAreas.filter((fwa) => fwa.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  // 作付けマスタを取得
  fetchCropTypes: async () => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        set({ cropTypes: mockCropTypes, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('crop_types')
        .select('*')
        .order('display_order')

      if (error) throw error
      set({ cropTypes: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  // 作付けマスタを追加
  createCropType: async (name) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()
      const currentCropTypes = get().cropTypes
      const maxOrder = currentCropTypes.reduce((max, ct) => Math.max(max, ct.display_order), 0)

      if (useDemoMode) {
        const newCropType: CropType = {
          id: `crop-${Date.now()}`,
          name,
          display_order: maxOrder + 1,
          is_default: false,
          created_at: new Date().toISOString(),
        }
        set((state) => ({
          cropTypes: [...state.cropTypes, newCropType],
          isLoading: false,
        }))
        return newCropType
      }

      const { data, error } = await supabase
        .from('crop_types')
        .insert({
          name,
          display_order: maxOrder + 1,
          is_default: false,
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        cropTypes: [...state.cropTypes, data],
        isLoading: false,
      }))
      return data
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  // 圃場作付けを取得
  fetchFieldCrops: async (fieldId: string) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        // デモモードでは現在のfieldIdに一致するデータのみフィルタリング
        const currentCrops = get().fieldCrops.filter(fc => fc.field_id === fieldId)
        set({ fieldCrops: currentCrops, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('field_crops')
        .select('*, crop_type:crop_types(*)')
        .eq('field_id', fieldId)
        .order('fiscal_year', { ascending: false })

      if (error) throw error
      set({ fieldCrops: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  // 全圃場の作付けを一括取得
  fetchAllFieldCrops: async (fieldIds: string[]) => {
    if (fieldIds.length === 0) {
      set({ fieldCrops: [] })
      return
    }
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        // デモモードでは現在のfieldCropsから該当fieldIdsのデータのみ保持
        const currentCrops = get().fieldCrops.filter(fc => fieldIds.includes(fc.field_id))
        set({ fieldCrops: currentCrops })
        return
      }
      set({ isLoading: true, error: null })

      const { data, error } = await supabase
        .from('field_crops')
        .select('*, crop_type:crop_types(*)')
        .in('field_id', fieldIds)
        .order('fiscal_year', { ascending: false })

      if (error) throw error
      set({ fieldCrops: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  // 圃場作付けを追加
  createFieldCrop: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        const cropType = get().cropTypes.find(ct => ct.id === data.crop_type_id)
        const newFieldCrop: FieldCropWithCropType = {
          id: `fc-${Date.now()}`,
          field_id: data.field_id,
          crop_type_id: data.crop_type_id,
          fiscal_year: data.fiscal_year,
          area_hectares: data.area_hectares,
          notes: data.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          crop_type: cropType!,
        }
        set((state) => ({
          fieldCrops: [...state.fieldCrops, newFieldCrop],
          isLoading: false,
        }))
        return newFieldCrop
      }

      const { data: result, error } = await supabase
        .from('field_crops')
        .insert({
          field_id: data.field_id,
          crop_type_id: data.crop_type_id,
          fiscal_year: data.fiscal_year,
          area_hectares: data.area_hectares,
          notes: data.notes,
        })
        .select('*, crop_type:crop_types(*)')
        .single()

      if (error) throw error

      set((state) => ({
        fieldCrops: [...state.fieldCrops, result],
        isLoading: false,
      }))
      return result
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  // 圃場作付けを更新
  updateFieldCrop: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        set((state) => ({
          fieldCrops: state.fieldCrops.map((fc) =>
            fc.id === id ? { ...fc, ...data, updated_at: new Date().toISOString() } : fc
          ),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase
        .from('field_crops')
        .update(data)
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        fieldCrops: state.fieldCrops.map((fc) =>
          fc.id === id ? { ...fc, ...data, updated_at: new Date().toISOString() } : fc
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  // 圃場作付けを削除
  deleteFieldCrop: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        set((state) => ({
          fieldCrops: state.fieldCrops.filter((fc) => fc.id !== id),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase.from('field_crops').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        fieldCrops: state.fieldCrops.filter((fc) => fc.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  // 工種割り当て（工程管理）を作成
  createFieldWorkAssignment: async (projectFieldId, data) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()
      const { workTypes } = get()

      if (useDemoMode) {
        const workType = workTypes.find((wt) => wt.id === data.work_type_id)
        const newAssignment: FieldWorkAssignmentWithDetails = {
          id: `assignment-${Date.now()}`,
          project_field_id: projectFieldId,
          work_type_id: data.work_type_id,
          assigned_company_id: data.assigned_company_id || null,
          status: data.status || 'not_started',
          progress_pct: data.progress_pct || 0,
          planned_start: data.planned_start || null,
          planned_end: data.planned_end || null,
          actual_start: data.actual_start || null,
          actual_end: data.actual_end || null,
          estimated_hours: data.estimated_hours || null,
          actual_hours: data.actual_hours || 0,
          notes: data.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          work_type: workType!,
        }

        set((state) => ({
          projectFields: state.projectFields.map((pf) =>
            pf.id === projectFieldId
              ? { ...pf, assignments: [...pf.assignments, newAssignment] }
              : pf
          ),
          isLoading: false,
        }))

        return newAssignment
      }

      const { data: created, error } = await supabase
        .from('field_work_assignments')
        .insert({
          project_field_id: projectFieldId,
          ...data,
        })
        .select('*, work_type:work_types(*), assigned_company:companies(*)')
        .single()

      if (error) throw error

      set((state) => ({
        projectFields: state.projectFields.map((pf) =>
          pf.id === projectFieldId
            ? { ...pf, assignments: [...pf.assignments, created as FieldWorkAssignmentWithDetails] }
            : pf
        ),
        isLoading: false,
      }))

      return created as FieldWorkAssignmentWithDetails
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  // 工種割り当て（工程管理）を更新
  updateFieldWorkAssignment: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        set((state) => ({
          projectFields: state.projectFields.map((pf) => ({
            ...pf,
            assignments: pf.assignments.map((a) =>
              a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a
            ),
          })),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase
        .from('field_work_assignments')
        .update(data)
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        projectFields: state.projectFields.map((pf) => ({
          ...pf,
          assignments: pf.assignments.map((a) =>
            a.id === id ? { ...a, ...data, updated_at: new Date().toISOString() } : a
          ),
        })),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  // 工種割り当て（工程管理）を削除
  deleteFieldWorkAssignment: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = isDemoMode()

      if (useDemoMode) {
        set((state) => ({
          projectFields: state.projectFields.map((pf) => ({
            ...pf,
            assignments: pf.assignments.filter((a) => a.id !== id),
          })),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase.from('field_work_assignments').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        projectFields: state.projectFields.map((pf) => ({
          ...pf,
          assignments: pf.assignments.filter((a) => a.id !== id),
        })),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },
}))

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Company, ProjectCompanyWithDetails, CompanyRole } from '@/types/database'

// デモモードの判定
const isDemoMode = () => !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEMO_MODE === 'true'

// デモ用のモック業者データ
const mockCompanies: Company[] = [
  {
    id: 'company-1',
    name: '北海道建設株式会社',
    company_type: 'prime_contractor',
    specialty: '総合建設',
    phone: '011-123-4567',
    email: 'info@hokkaido-kensetsu.co.jp',
    address: '北海道札幌市中央区大通西1-1-1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'company-2',
    name: '旭川測量事務所',
    company_type: 'subcontractor',
    specialty: '測量',
    phone: '0166-22-3344',
    email: 'info@asahikawa-survey.co.jp',
    address: '北海道旭川市4条通8丁目',
    created_at: new Date().toISOString(),
  },
  {
    id: 'company-3',
    name: '道北掘削工業',
    company_type: 'subcontractor',
    specialty: '掘削',
    phone: '0166-33-4455',
    email: 'info@dohoku-excavation.co.jp',
    address: '北海道旭川市永山2条10丁目',
    created_at: new Date().toISOString(),
  },
  {
    id: 'company-4',
    name: '富良野運送',
    company_type: 'subcontractor',
    specialty: '運搬',
    phone: '0167-23-5566',
    email: 'info@furano-transport.co.jp',
    address: '北海道富良野市本町1-1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'company-5',
    name: '十勝整地',
    company_type: 'subcontractor',
    specialty: '整地',
    phone: '0155-24-6677',
    email: 'info@tokachi-grading.co.jp',
    address: '北海道帯広市西2条南9丁目',
    created_at: new Date().toISOString(),
  },
]

interface CompanyState {
  companies: Company[]
  projectCompanies: ProjectCompanyWithDetails[]
  isLoading: boolean
  error: string | null
  fetchCompanies: () => Promise<void>
  fetchProjectCompanies: (projectId: string) => Promise<void>
  createCompany: (company: Omit<Company, 'id' | 'created_at'>) => Promise<Company>
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>
  deleteCompany: (id: string) => Promise<void>
  addProjectCompany: (projectId: string, companyId: string, role: CompanyRole) => Promise<void>
  removeProjectCompany: (projectCompanyId: string) => Promise<void>
  updateProjectCompanyRole: (projectCompanyId: string, role: CompanyRole) => Promise<void>
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  companies: [],
  projectCompanies: [],
  isLoading: false,
  error: null,

  fetchCompanies: async () => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        set({ companies: mockCompanies, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name')

      if (error) throw error
      set({ companies: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchProjectCompanies: async (projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        // デモモード: プロジェクトに紐づくモックデータ
        const mockProjectCompanies: ProjectCompanyWithDetails[] = [
          {
            id: 'pc-1',
            project_id: projectId,
            company_id: 'company-2',
            role: 'sub_surveying',
            joined_at: '2024-04-01T00:00:00Z',
            company: mockCompanies[1],
          },
          {
            id: 'pc-2',
            project_id: projectId,
            company_id: 'company-3',
            role: 'sub_excavation',
            joined_at: '2024-04-01T00:00:00Z',
            company: mockCompanies[2],
          },
          {
            id: 'pc-3',
            project_id: projectId,
            company_id: 'company-5',
            role: 'sub_grading',
            joined_at: '2024-04-01T00:00:00Z',
            company: mockCompanies[4],
          },
        ]
        set({ projectCompanies: mockProjectCompanies, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('project_companies')
        .select(`
          *,
          company:companies(*)
        `)
        .eq('project_id', projectId)

      if (error) throw error
      set({ projectCompanies: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createCompany: async (companyData) => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        const newCompany: Company = {
          ...companyData,
          id: `company-${Date.now()}`,
          created_at: new Date().toISOString(),
        }
        set((state) => ({
          companies: [newCompany, ...state.companies],
          isLoading: false,
        }))
        return newCompany
      }

      const { data, error } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        companies: [data, ...state.companies],
        isLoading: false,
      }))
      return data
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateCompany: async (id, companyData) => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        set((state) => ({
          companies: state.companies.map((c) =>
            c.id === id ? { ...c, ...companyData } : c
          ),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        companies: state.companies.map((c) =>
          c.id === id ? { ...c, ...companyData } : c
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  deleteCompany: async (id) => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== id),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase.from('companies').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        companies: state.companies.filter((c) => c.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  addProjectCompany: async (projectId, companyId, role) => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        const company = get().companies.find((c) => c.id === companyId)
        if (!company) throw new Error('業者が見つかりません')

        const newProjectCompany: ProjectCompanyWithDetails = {
          id: `pc-${Date.now()}`,
          project_id: projectId,
          company_id: companyId,
          role,
          joined_at: new Date().toISOString(),
          company,
        }
        set((state) => ({
          projectCompanies: [...state.projectCompanies, newProjectCompany],
          isLoading: false,
        }))
        return
      }

      const { data, error } = await supabase
        .from('project_companies')
        .insert({
          project_id: projectId,
          company_id: companyId,
          role,
        })
        .select(`
          *,
          company:companies(*)
        `)
        .single()

      if (error) throw error

      set((state) => ({
        projectCompanies: [...state.projectCompanies, data],
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  removeProjectCompany: async (projectCompanyId) => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        set((state) => ({
          projectCompanies: state.projectCompanies.filter(
            (pc) => pc.id !== projectCompanyId
          ),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase
        .from('project_companies')
        .delete()
        .eq('id', projectCompanyId)

      if (error) throw error

      set((state) => ({
        projectCompanies: state.projectCompanies.filter(
          (pc) => pc.id !== projectCompanyId
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateProjectCompanyRole: async (projectCompanyId, role) => {
    set({ isLoading: true, error: null })
    try {
      if (isDemoMode()) {
        set((state) => ({
          projectCompanies: state.projectCompanies.map((pc) =>
            pc.id === projectCompanyId ? { ...pc, role } : pc
          ),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase
        .from('project_companies')
        .update({ role })
        .eq('id', projectCompanyId)

      if (error) throw error

      set((state) => ({
        projectCompanies: state.projectCompanies.map((pc) =>
          pc.id === projectCompanyId ? { ...pc, role } : pc
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },
}))

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/database'

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
  isLoading: boolean
  error: string | null
  fetchCompanies: () => Promise<void>
  createCompany: (company: Omit<Company, 'id' | 'created_at'>) => Promise<Company>
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>
  deleteCompany: (id: string) => Promise<void>
}

export const useCompanyStore = create<CompanyState>((set) => ({
  companies: [],
  isLoading: false,
  error: null,

  fetchCompanies: async () => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = true

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        set({ companies: mockCompanies, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ companies: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createCompany: async (companyData) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = true

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
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
      const useDemoMode = true

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
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
      const useDemoMode = true

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
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
}))

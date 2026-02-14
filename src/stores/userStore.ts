import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Company } from '@/types/database'

// 結合型
export interface UserWithCompany extends User {
  company?: Company
}

// デモ用のモックユーザーデータ
const mockUsers: UserWithCompany[] = [
  {
    id: 'user-1',
    company_id: 'company-1',
    email: 'tanaka@hokkaido-kensetsu.co.jp',
    name: '田中 太郎',
    role: 'admin',
    phone: '090-1111-2222',
    avatar_url: null,
    auth_id: 'auth-1',
    is_active: true,
    created_at: new Date().toISOString(),
    company: {
      id: 'company-1',
      name: '北海道建設株式会社',
      company_type: 'prime_contractor',
      specialty: '総合建設',
      phone: '011-123-4567',
      email: 'info@hokkaido-kensetsu.co.jp',
      address: '北海道札幌市中央区大通西1-1-1',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'user-2',
    company_id: 'company-1',
    email: 'suzuki@hokkaido-kensetsu.co.jp',
    name: '鈴木 花子',
    role: 'manager',
    phone: '090-2222-3333',
    avatar_url: null,
    auth_id: 'auth-2',
    is_active: true,
    created_at: new Date().toISOString(),
    company: {
      id: 'company-1',
      name: '北海道建設株式会社',
      company_type: 'prime_contractor',
      specialty: '総合建設',
      phone: '011-123-4567',
      email: 'info@hokkaido-kensetsu.co.jp',
      address: '北海道札幌市中央区大通西1-1-1',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'user-3',
    company_id: 'company-2',
    email: 'yamamoto@asahikawa-survey.co.jp',
    name: '山本 次郎',
    role: 'member',
    phone: '090-3333-4444',
    avatar_url: null,
    auth_id: 'auth-3',
    is_active: true,
    created_at: new Date().toISOString(),
    company: {
      id: 'company-2',
      name: '旭川測量事務所',
      company_type: 'subcontractor',
      specialty: '測量',
      phone: '0166-22-3344',
      email: 'info@asahikawa-survey.co.jp',
      address: '北海道旭川市4条通8丁目',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'user-4',
    company_id: 'company-3',
    email: 'sato@dohoku-excavation.co.jp',
    name: '佐藤 三郎',
    role: 'manager',
    phone: '090-4444-5555',
    avatar_url: null,
    auth_id: 'auth-4',
    is_active: true,
    created_at: new Date().toISOString(),
    company: {
      id: 'company-3',
      name: '道北掘削工業',
      company_type: 'subcontractor',
      specialty: '掘削',
      phone: '0166-33-4455',
      email: 'info@dohoku-excavation.co.jp',
      address: '北海道旭川市永山2条10丁目',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'user-5',
    company_id: 'company-4',
    email: 'watanabe@furano-transport.co.jp',
    name: '渡辺 四郎',
    role: 'member',
    phone: '090-5555-6666',
    avatar_url: null,
    auth_id: 'auth-5',
    is_active: false,
    created_at: new Date().toISOString(),
    company: {
      id: 'company-4',
      name: '富良野運送',
      company_type: 'subcontractor',
      specialty: '運搬',
      phone: '0167-23-5566',
      email: 'info@furano-transport.co.jp',
      address: '北海道富良野市本町1-1',
      created_at: new Date().toISOString(),
    },
  },
]

interface UserState {
  users: UserWithCompany[]
  isLoading: boolean
  error: string | null
  fetchUsers: () => Promise<void>
  createUser: (user: Omit<User, 'id' | 'created_at'>) => Promise<User>
  updateUser: (id: string, user: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  toggleUserActive: (id: string) => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = true

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        set({ users: mockUsers, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*, company:companies(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ users: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createUser: async (userData) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = true

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        const company = mockUsers.find((u) => u.company_id === userData.company_id)?.company

        const newUser: UserWithCompany = {
          ...userData,
          id: `user-${Date.now()}`,
          created_at: new Date().toISOString(),
          company,
        }
        set((state) => ({
          users: [newUser, ...state.users],
          isLoading: false,
        }))
        return newUser
      }

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select('*, company:companies(*)')
        .single()

      if (error) throw error

      set((state) => ({
        users: [data, ...state.users],
        isLoading: false,
      }))
      return data
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateUser: async (id, userData) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = true

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, ...userData } : u
          ),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase.from('users').update(userData).eq('id', id)

      if (error) throw error

      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, ...userData } : u
        ),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const useDemoMode = true

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
          isLoading: false,
        }))
        return
      }

      const { error } = await supabase.from('users').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  toggleUserActive: async (id) => {
    const { users } = get()
    const user = users.find((u) => u.id === id)
    if (user) {
      await get().updateUser(id, { is_active: !user.is_active })
    }
  },
}))

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, companyId: string) => Promise<void>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
  setUser: (user: User | null) => void
}

// デモ用のモックユーザー
const mockUser: User = {
  id: 'demo-user-id',
  company_id: 'demo-company-id',
  email: 'demo@example.com',
  name: 'デモユーザー',
  role: 'manager',
  phone: '090-1234-5678',
  avatar_url: null,
  auth_id: 'demo-auth-id',
  is_active: true,
  created_at: new Date().toISOString(),
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      // 開発中はデモモードを使用（本番環境では以下の条件を変更）
      const useDemoMode = true // false にするとSupabase認証を使用

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモード: 任意のメール/パスワードでログイン可能
        set({ user: { ...mockUser, email }, isAuthenticated: true, isLoading: false })
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // ユーザー情報を取得
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single()

      if (userError) throw userError

      set({ user: userData, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  signUp: async (email: string, password: string, name: string, companyId: string) => {
    set({ isLoading: true })
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        set({ user: { ...mockUser, email, name }, isAuthenticated: true, isLoading: false })
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error

      if (data.user) {
        // ユーザーレコードを作成
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            company_id: companyId,
            email,
            name,
            auth_id: data.user.id,
            role: 'member',
            is_active: true,
          })
          .select()
          .single()

        if (userError) throw userError
        set({ user: userData, isAuthenticated: true, isLoading: false })
      }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    try {
      if (import.meta.env.VITE_SUPABASE_URL) {
        await supabase.auth.signOut()
      }
      set({ user: null, isAuthenticated: false, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      // 開発中はデモモードを使用
      const useDemoMode = true

      if (useDemoMode || !import.meta.env.VITE_SUPABASE_URL) {
        // デモモード: 自動ログイン
        set({ user: mockUser, isAuthenticated: true, isLoading: false })
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .single()

        if (userData) {
          set({ user: userData, isAuthenticated: true, isLoading: false })
          return
        }
      }

      set({ user: null, isAuthenticated: false, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user })
  },
}))

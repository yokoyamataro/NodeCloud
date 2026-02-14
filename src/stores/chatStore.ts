import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { ChatChannelWithDetails, ChatMessageWithSender, User } from '@/types/database'

// デモ用データ
const demoChannels: ChatChannelWithDetails[] = [
  {
    id: 'channel-1',
    project_id: 'project-1',
    channel_type: 'project',
    field_id: null,
    work_type_id: null,
    name: '空知地区 - 全体連絡',
    is_archived: false,
    created_at: '2024-04-01T00:00:00Z',
    unread_count: 2,
  },
  {
    id: 'channel-2',
    project_id: 'project-1',
    channel_type: 'field_work',
    field_id: 'field-1',
    work_type_id: 'wt-1',
    name: '1-1 暗渠工事',
    is_archived: false,
    created_at: '2024-04-01T00:00:00Z',
    unread_count: 0,
  },
  {
    id: 'channel-3',
    project_id: 'project-1',
    channel_type: 'field_work',
    field_id: 'field-1',
    work_type_id: 'wt-2',
    name: '1-1 客土工事',
    is_archived: false,
    created_at: '2024-04-15T00:00:00Z',
    unread_count: 5,
  },
]

const demoUsers: Record<string, User> = {
  'user-1': {
    id: 'user-1',
    company_id: 'company-1',
    email: 'yamada@example.com',
    name: '山田太郎',
    role: 'manager',
    phone: '090-1234-5678',
    avatar_url: null,
    auth_id: 'auth-1',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  'user-2': {
    id: 'user-2',
    company_id: 'company-2',
    email: 'suzuki@example.com',
    name: '鈴木一郎',
    role: 'member',
    phone: '080-9876-5432',
    avatar_url: null,
    auth_id: 'auth-2',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  'demo-user-id': {
    id: 'demo-user-id',
    company_id: 'demo-company-id',
    email: 'demo@example.com',
    name: 'デモユーザー',
    role: 'manager',
    phone: '090-0000-0000',
    avatar_url: null,
    auth_id: 'demo-auth-id',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
  },
}

const demoMessages: Record<string, ChatMessageWithSender[]> = {
  'channel-1': [
    {
      id: 'msg-1',
      channel_id: 'channel-1',
      sender_id: 'user-1',
      content: '本日の作業予定を共有します。暗渠工事は1-1圃場から着手予定です。',
      reply_to_id: null,
      is_pinned: false,
      created_at: '2024-04-01T09:00:00Z',
      updated_at: '2024-04-01T09:00:00Z',
      sender: demoUsers['user-1'],
    },
    {
      id: 'msg-2',
      channel_id: 'channel-1',
      sender_id: 'user-2',
      content: '了解しました。測量班は8時に現場入りします。',
      reply_to_id: null,
      is_pinned: false,
      created_at: '2024-04-01T09:05:00Z',
      updated_at: '2024-04-01T09:05:00Z',
      sender: demoUsers['user-2'],
    },
    {
      id: 'msg-3',
      channel_id: 'channel-1',
      sender_id: 'demo-user-id',
      content: '明日の天気予報では午後から雨の予報です。作業スケジュールの調整をお願いします。',
      reply_to_id: null,
      is_pinned: true,
      created_at: '2024-04-01T10:30:00Z',
      updated_at: '2024-04-01T10:30:00Z',
      sender: demoUsers['demo-user-id'],
    },
  ],
  'channel-2': [
    {
      id: 'msg-4',
      channel_id: 'channel-2',
      sender_id: 'user-1',
      content: '1-1圃場の暗渠工事が完了しました。次は1-2に移ります。',
      reply_to_id: null,
      is_pinned: false,
      created_at: '2024-04-14T17:00:00Z',
      updated_at: '2024-04-14T17:00:00Z',
      sender: demoUsers['user-1'],
    },
  ],
  'channel-3': [
    {
      id: 'msg-5',
      channel_id: 'channel-3',
      sender_id: 'user-2',
      content: '客土運搬車両が到着しました。搬入開始します。',
      reply_to_id: null,
      is_pinned: false,
      created_at: '2024-04-16T08:30:00Z',
      updated_at: '2024-04-16T08:30:00Z',
      sender: demoUsers['user-2'],
    },
  ],
}

interface ChatState {
  channels: ChatChannelWithDetails[]
  currentChannel: ChatChannelWithDetails | null
  messages: ChatMessageWithSender[]
  isLoading: boolean
  error: string | null
  fetchChannels: (projectId: string) => Promise<void>
  fetchMessages: (channelId: string) => Promise<void>
  sendMessage: (channelId: string, content: string, senderId: string) => Promise<void>
  setCurrentChannel: (channel: ChatChannelWithDetails | null) => void
  subscribeToMessages: (channelId: string) => () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [],
  currentChannel: null,
  messages: [],
  isLoading: false,
  error: null,

  fetchChannels: async (projectId: string) => {
    set({ isLoading: true, error: null })
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        const filtered = demoChannels.filter(c => c.project_id === projectId)
        set({ channels: filtered, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('chat_channels')
        .select(`
          *,
          field:fields(*),
          work_type:work_types(*)
        `)
        .eq('project_id', projectId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ channels: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchMessages: async (channelId: string) => {
    set({ isLoading: true, error: null })
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        const messages = demoMessages[channelId] || []
        set({ messages, isLoading: false })
        return
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users(*),
          attachments:message_attachments(*)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })

      if (error) throw error
      set({ messages: data || [], isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  sendMessage: async (channelId: string, content: string, senderId: string) => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        // デモモード
        const newMessage: ChatMessageWithSender = {
          id: `msg-${Date.now()}`,
          channel_id: channelId,
          sender_id: senderId,
          content,
          reply_to_id: null,
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sender: demoUsers[senderId] || demoUsers['demo-user-id'],
        }
        set(state => ({ messages: [...state.messages, newMessage] }))
        return
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          sender_id: senderId,
          content,
        })

      if (error) throw error
      // リアルタイム購読で自動的にメッセージが追加される
    } catch (error) {
      throw error
    }
  },

  setCurrentChannel: (channel: ChatChannelWithDetails | null) => {
    set({ currentChannel: channel })
    if (channel) {
      get().fetchMessages(channel.id)
    }
  },

  subscribeToMessages: (channelId: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL) {
      // デモモードでは何もしない
      return () => {}
    }

    const subscription = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          // 送信者情報を取得
          const { data: sender } = await supabase
            .from('users')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage: ChatMessageWithSender = {
            ...payload.new as any,
            sender,
          }

          set(state => ({
            messages: [...state.messages, newMessage],
          }))
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  },
}))

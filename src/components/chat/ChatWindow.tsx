import { useEffect } from 'react'
import { Hash, Settings, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/authStore'
import type { ChatChannelWithDetails } from '@/types/database'

interface ChatWindowProps {
  channel: ChatChannelWithDetails
}

export function ChatWindow({ channel }: ChatWindowProps) {
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useChatStore()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchMessages(channel.id)
    const unsubscribe = subscribeToMessages(channel.id)
    return () => unsubscribe()
  }, [channel.id, fetchMessages, subscribeToMessages])

  const handleSendMessage = async (content: string) => {
    if (user) {
      await sendMessage(channel.id, content, user.id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">{channel.name}</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Users className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* メッセージ一覧 */}
      <MessageList messages={messages} currentUserId={user?.id || ''} />

      {/* 入力欄 */}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  )
}

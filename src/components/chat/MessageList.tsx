import { useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Pin } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ChatMessageWithSender } from '@/types/database'

interface MessageListProps {
  messages: ChatMessageWithSender[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 新しいメッセージが追加されたらスクロール
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // 日付ごとにグループ化
  const groupedMessages = messages.reduce((groups, message) => {
    const date = format(new Date(message.created_at), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {} as Record<string, ChatMessageWithSender[]>)

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-4 space-y-4">
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <div key={date}>
            {/* 日付セパレータ */}
            <div className="flex items-center gap-4 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">
                {format(new Date(date), 'M月d日(E)', { locale: ja })}
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* メッセージ */}
            <div className="space-y-3">
              {dayMessages.map((message) => {
                const isOwn = message.sender_id === currentUserId

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      isOwn && 'flex-row-reverse'
                    )}
                  >
                    {!isOwn && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={message.sender.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {message.sender.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn('max-w-[70%]', isOwn && 'items-end')}>
                      {!isOwn && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{message.sender.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                          {message.is_pinned && (
                            <Pin className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      )}
                      <div
                        className={cn(
                          'rounded-lg px-4 py-2',
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {isOwn && (
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), 'HH:mm')}
                          </span>
                          {message.is_pinned && (
                            <Pin className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p>メッセージがありません</p>
            <p className="text-sm">最初のメッセージを送信しましょう</p>
          </div>
        )}

        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  )
}

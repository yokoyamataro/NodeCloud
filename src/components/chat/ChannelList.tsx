import { Hash, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { ChatChannelWithDetails } from '@/types/database'

interface ChannelListProps {
  channels: ChatChannelWithDetails[]
  selectedChannelId: string | null
  onSelectChannel: (channel: ChatChannelWithDetails) => void
}

export function ChannelList({ channels, selectedChannelId, onSelectChannel }: ChannelListProps) {
  // チャンネルタイプでグループ化
  const projectChannels = channels.filter(c => c.channel_type === 'project')
  const fieldWorkChannels = channels.filter(c => c.channel_type === 'field_work')
  const fieldChannels = channels.filter(c => c.channel_type === 'field')
  const workTypeChannels = channels.filter(c => c.channel_type === 'work_type')

  const renderChannel = (channel: ChatChannelWithDetails) => {
    const isSelected = selectedChannelId === channel.id
    const hasUnread = (channel.unread_count || 0) > 0

    return (
      <button
        key={channel.id}
        onClick={() => onSelectChannel(channel)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors',
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'text-gray-600 hover:bg-gray-100'
        )}
      >
        <Hash className="h-4 w-4 flex-shrink-0" />
        <span className={cn('flex-1 truncate', hasUnread && 'font-semibold')}>
          {channel.name}
        </span>
        {hasUnread && (
          <Badge variant="destructive" className="h-5 min-w-[20px] flex items-center justify-center">
            {channel.unread_count}
          </Badge>
        )}
      </button>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-4">
        {/* 全体連絡 */}
        {projectChannels.length > 0 && (
          <div>
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-1">
              全体連絡
            </p>
            <div className="space-y-0.5">
              {projectChannels.map(renderChannel)}
            </div>
          </div>
        )}

        {/* 圃場×工種 */}
        {fieldWorkChannels.length > 0 && (
          <div>
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-1">
              圃場×工種
            </p>
            <div className="space-y-0.5">
              {fieldWorkChannels.map(renderChannel)}
            </div>
          </div>
        )}

        {/* 圃場 */}
        {fieldChannels.length > 0 && (
          <div>
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-1">
              圃場
            </p>
            <div className="space-y-0.5">
              {fieldChannels.map(renderChannel)}
            </div>
          </div>
        )}

        {/* 工種 */}
        {workTypeChannels.length > 0 && (
          <div>
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase mb-1">
              工種
            </p>
            <div className="space-y-0.5">
              {workTypeChannels.map(renderChannel)}
            </div>
          </div>
        )}

        {channels.length === 0 && (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">チャンネルがありません</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

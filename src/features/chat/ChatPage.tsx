import { useEffect, useRef } from 'react'
import { Plus, MessageSquare, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChannelList } from '@/components/chat/ChannelList'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { useChatStore } from '@/stores/chatStore'
import { useProjectStore, useSelectedProjectStore } from '@/stores/projectStore'

export function ChatPage() {
  const { projects, fetchProjects } = useProjectStore()
  const { selectedProjectId, _hasHydrated } = useSelectedProjectStore()
  const { channels, currentChannel, fetchChannels, setCurrentChannel } = useChatStore()
  const prevProjectIdRef = useRef<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (_hasHydrated && selectedProjectId) {
      fetchChannels(selectedProjectId)
    }
  }, [_hasHydrated, selectedProjectId, fetchChannels])

  // プロジェクトが変わったらチャンネル選択をリセット
  useEffect(() => {
    if (prevProjectIdRef.current !== selectedProjectId) {
      setCurrentChannel(null)
      prevProjectIdRef.current = selectedProjectId
    }
  }, [selectedProjectId, setCurrentChannel])

  // 最初のチャンネルを自動選択
  useEffect(() => {
    if (channels.length > 0 && !currentChannel) {
      setCurrentChannel(channels[0])
    }
  }, [channels, currentChannel, setCurrentChannel])

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // 工事が選択されていない場合
  if (!selectedProjectId || !selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">チャット</h1>
          <p className="text-muted-foreground">工事担当者間でメッセージをやり取りできます</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">工事を選択してください</p>
          <p className="text-sm text-muted-foreground mt-2">
            ヘッダーから工事を選択すると、その工事のチャットが表示されます
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">チャット</h1>
          <p className="text-muted-foreground">
            {selectedProject.fiscal_year && `${selectedProject.fiscal_year}年度 `}
            {selectedProject.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            チャンネル作成
          </Button>
        </div>
      </div>

      <Card className="h-[calc(100%-4rem)]">
        <CardContent className="p-0 h-full flex">
          {/* チャンネル一覧 */}
          <div className="w-64 border-r bg-gray-50 flex-shrink-0">
            <div className="p-3 border-b">
              <h3 className="font-semibold text-sm">チャンネル</h3>
            </div>
            <ChannelList
              channels={channels}
              selectedChannelId={currentChannel?.id || null}
              onSelectChannel={setCurrentChannel}
            />
          </div>

          {/* チャットウィンドウ */}
          <div className="flex-1 bg-white">
            {currentChannel ? (
              <ChatWindow channel={currentChannel} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">チャンネルを選択してください</p>
                  <p className="text-sm">左のリストからチャンネルを選択してメッセージを開始します</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

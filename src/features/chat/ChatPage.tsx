import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChannelList } from '@/components/chat/ChannelList'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { useChatStore } from '@/stores/chatStore'
import { useProjectStore } from '@/stores/projectStore'

export function ChatPage() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  const { projects, fetchProjects } = useProjectStore()
  const { channels, currentChannel, fetchChannels, setCurrentChannel } = useChatStore()

  const [selectedProject, setSelectedProject] = useState<string>(projectId || '')

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId)
    } else if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projectId, projects, selectedProject])

  useEffect(() => {
    if (selectedProject) {
      fetchChannels(selectedProject)
    }
  }, [selectedProject, fetchChannels])

  // プロジェクトが変わったらチャンネル選択をリセット
  useEffect(() => {
    setCurrentChannel(null)
  }, [selectedProject, setCurrentChannel])

  // 最初のチャンネルを自動選択
  useEffect(() => {
    if (channels.length > 0 && !currentChannel) {
      setCurrentChannel(channels[0])
    }
  }, [channels, currentChannel, setCurrentChannel])

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">チャット</h1>
          <p className="text-muted-foreground">工事担当者間でメッセージをやり取りできます</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="工事を選択" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

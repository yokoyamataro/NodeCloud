import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Map, Calendar, MessageSquare, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useProjectStore } from '@/stores/projectStore'
import { getStatusLabel, getStatusColor } from '@/lib/utils'

export function DashboardPage() {
  const { projects, fetchProjects, isLoading } = useProjectStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const activeProjects = projects.filter(p => p.status === 'active')
  const completedProjects = projects.filter(p => p.status === 'completed')
  const plannedProjects = projects.filter(p => p.status === 'planned')

  // サマリー統計
  const stats = [
    {
      name: '進行中の工事',
      value: activeProjects.length,
      icon: FolderKanban,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      name: '完了した工事',
      value: completedProjects.length,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      name: '計画中の工事',
      value: plannedProjects.length,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      name: '今月の進捗率',
      value: '68%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-muted-foreground">工事全体の概要を確認できます</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Link to="/projects">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <FolderKanban className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">工事一覧</p>
                <p className="text-sm text-muted-foreground">全ての工事を表示</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/map">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Map className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium">地図</p>
                <p className="text-sm text-muted-foreground">圃場を地図で確認</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/calendar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">カレンダー</p>
                <p className="text-sm text-muted-foreground">工程を確認</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/chat">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-medium">チャット</p>
                <p className="text-sm text-muted-foreground">メッセージを確認</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 進行中の工事 */}
      <Card>
        <CardHeader>
          <CardTitle>進行中の工事</CardTitle>
          <CardDescription>現在アクティブな工事の進捗状況</CardDescription>
        </CardHeader>
        <CardContent>
          {activeProjects.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              進行中の工事はありません
            </p>
          ) : (
            <div className="space-y-4">
              {activeProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.start_date} 〜 {project.end_date}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 w-32">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">進捗</span>
                        <span className="font-medium">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最近の活動 */}
      <Card>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
          <CardDescription>工事に関する最新の更新</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50">
              <div className="p-2 rounded-full bg-blue-100">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">1-1圃場の暗渠工事が完了しました</p>
                <p className="text-xs text-muted-foreground">空知地区農地整備事業 - 2時間前</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50">
              <div className="p-2 rounded-full bg-green-100">
                <MessageSquare className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">新しいメッセージ: 「明日の作業予定について」</p>
                <p className="text-xs text-muted-foreground">空知地区 - 全体連絡 - 3時間前</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50">
              <div className="p-2 rounded-full bg-yellow-100">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium">1-2圃場の客土工事の予定が更新されました</p>
                <p className="text-xs text-muted-foreground">空知地区農地整備事業 - 5時間前</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

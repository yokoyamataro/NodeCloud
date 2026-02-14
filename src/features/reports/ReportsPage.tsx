import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Plus, FileText, Cloud, Sun, CloudRain, Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useProjectStore, useSelectedProjectStore } from '@/stores/projectStore'

// デモ用日報データ
const demoReports = [
  {
    id: 'report-1',
    report_date: '2024-05-01',
    field_label: '1-1',
    work_type: '暗渠',
    reporter: '山田太郎',
    hours_worked: 8,
    workers_count: 3,
    weather: '晴れ',
    description: '暗渠管敷設作業。A区画の残り50m完了。',
    equipment: ['バックホー', 'ダンプ'],
  },
  {
    id: 'report-2',
    report_date: '2024-05-01',
    field_label: '1-2',
    work_type: '客土',
    reporter: '鈴木一郎',
    hours_worked: 6,
    workers_count: 2,
    weather: '晴れ',
    description: '客土搬入・敷均し作業。',
    equipment: ['ダンプ', 'ブルドーザー'],
  },
  {
    id: 'report-3',
    report_date: '2024-04-30',
    field_label: '1-1',
    work_type: '暗渠',
    reporter: '山田太郎',
    hours_worked: 7.5,
    workers_count: 3,
    weather: '曇り',
    description: '暗渠管敷設作業続行。',
    equipment: ['バックホー'],
  },
]

const weatherIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '晴れ': Sun,
  '曇り': Cloud,
  '雨': CloudRain,
}

export function ReportsPage() {
  const { projects, fetchProjects } = useProjectStore()
  const { selectedProjectId } = useSelectedProjectStore()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // TODO: 実際は選択中の工事の日報をフィルタリング
  const filteredReports = filterDate
    ? demoReports.filter(r => r.report_date === filterDate)
    : demoReports

  // 日付でグループ化
  const groupedReports = filteredReports.reduce((groups, report) => {
    const date = report.report_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(report)
    return groups
  }, {} as Record<string, typeof demoReports>)

  // 工事が選択されていない場合
  if (!selectedProjectId || !selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">日報</h1>
          <p className="text-muted-foreground">作業日報の入力・確認ができます</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">工事を選択してください</p>
          <p className="text-sm text-muted-foreground mt-2">
            ヘッダーから工事を選択すると、その工事の日報が表示されます
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">日報</h1>
          <p className="text-muted-foreground">
            {selectedProject.fiscal_year && `${selectedProject.fiscal_year}年度 `}
            {selectedProject.name}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              日報作成
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>日報作成</DialogTitle>
              <DialogDescription>
                本日の作業内容を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report_date">作業日</Label>
                  <Input
                    id="report_date"
                    type="date"
                    defaultValue={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weather">天候</Label>
                  <Select defaultValue="晴れ">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="晴れ">晴れ</SelectItem>
                      <SelectItem value="曇り">曇り</SelectItem>
                      <SelectItem value="雨">雨</SelectItem>
                      <SelectItem value="雪">雪</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field">圃場</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="圃場を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-1">1-1 (山田農場)</SelectItem>
                      <SelectItem value="1-2">1-2 (山田農場)</SelectItem>
                      <SelectItem value="2-1">2-1 (鈴木牧場)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_type">工種</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="工種を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="underdrain">暗渠</SelectItem>
                      <SelectItem value="soil_import">客土</SelectItem>
                      <SelectItem value="subsoil_break">心破</SelectItem>
                      <SelectItem value="grading">整地</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">作業時間（時間）</Label>
                  <Input id="hours" type="number" step="0.5" defaultValue="8" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workers">作業員数</Label>
                  <Input id="workers" type="number" defaultValue="1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment">使用機械</Label>
                <Input
                  id="equipment"
                  placeholder="バックホー、ダンプ など（カンマ区切り）"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">作業内容</Label>
                <Textarea
                  id="description"
                  placeholder="本日の作業内容を入力してください"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">一覧</TabsTrigger>
          <TabsTrigger value="calendar">カレンダー</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* フィルター */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    placeholder="日付で絞り込み"
                  />
                </div>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="圃場で絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="1-1">1-1</SelectItem>
                    <SelectItem value="1-2">1-2</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="工種で絞り込み" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="underdrain">暗渠</SelectItem>
                    <SelectItem value="soil_import">客土</SelectItem>
                  </SelectContent>
                </Select>
                {filterDate && (
                  <Button variant="outline" onClick={() => setFilterDate('')}>
                    クリア
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 日報一覧 */}
          {Object.entries(groupedReports).map(([date, reports]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {format(new Date(date), 'yyyy年M月d日(E)', { locale: ja })}
              </h3>
              <div className="space-y-3">
                {reports.map((report) => {
                  const WeatherIcon = weatherIcons[report.weather] || Cloud

                  return (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {report.reporter.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{report.reporter}</span>
                                <Badge variant="outline">{report.field_label}</Badge>
                                <Badge
                                  style={{
                                    backgroundColor:
                                      report.work_type === '暗渠' ? '#3B82F6' :
                                      report.work_type === '客土' ? '#F59E0B' : '#6B7280',
                                    color: 'white',
                                  }}
                                >
                                  {report.work_type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{report.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>{report.hours_worked}時間</span>
                                <span>作業員{report.workers_count}名</span>
                                <span>{report.equipment.join('・')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <WeatherIcon className="h-5 w-5" />
                            <span className="text-sm">{report.weather}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">日報がありません</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>日報カレンダー</CardTitle>
              <CardDescription>日報の提出状況をカレンダーで確認</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                カレンダービューは開発中です
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

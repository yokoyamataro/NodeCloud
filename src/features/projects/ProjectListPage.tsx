import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Building2, Calendar, MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectStore } from '@/stores/projectStore'
import { getStatusLabel, getStatusColor } from '@/lib/utils'
import type { ProjectStatus } from '@/types/database'

// 座標系の選択肢（日本測地系2011）
const COORDINATE_SYSTEMS = [
  { value: 'EPSG:6669', label: '第1系（長崎県、鹿児島県の一部）' },
  { value: 'EPSG:6670', label: '第2系（福岡県、佐賀県、熊本県、大分県、宮崎県、鹿児島県）' },
  { value: 'EPSG:6671', label: '第3系（山口県、島根県、広島県）' },
  { value: 'EPSG:6672', label: '第4系（香川県、愛媛県、徳島県、高知県）' },
  { value: 'EPSG:6673', label: '第5系（兵庫県、鳥取県、岡山県）' },
  { value: 'EPSG:6674', label: '第6系（京都府、大阪府、福井県、滋賀県、三重県、奈良県、和歌山県）' },
  { value: 'EPSG:6675', label: '第7系（石川県、富山県、岐阜県、愛知県）' },
  { value: 'EPSG:6676', label: '第8系（新潟県、長野県、山梨県、静岡県）' },
  { value: 'EPSG:6677', label: '第9系（東京都、福島県、栃木県、茨城県、埼玉県、千葉県、群馬県、神奈川県）' },
  { value: 'EPSG:6678', label: '第10系（青森県、秋田県、山形県、岩手県、宮城県）' },
  { value: 'EPSG:6679', label: '第11系（北海道（小樽、函館）、青森県）' },
  { value: 'EPSG:6680', label: '第12系（北海道）' },
  { value: 'EPSG:6681', label: '第13系（北海道（北見、網走、紋別、稚内））' },
]

interface ProjectFormData {
  fiscal_year: number
  name: string
  project_number: string
  client_name: string
  contractor_name: string
  start_date: string
  end_date: string
  coordinate_system: string
  description: string
}

const currentYear = new Date().getFullYear()
const initialFormData: ProjectFormData = {
  fiscal_year: currentYear,
  name: '',
  project_number: '',
  client_name: '',
  contractor_name: '',
  start_date: '',
  end_date: '',
  coordinate_system: 'EPSG:6680',
  description: '',
}

export function ProjectListPage() {
  const { projects, fetchProjects, createProject, isLoading } = useProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // 利用可能な年度のリストを取得
  const availableYears = [...new Set(projects.map(p => p.fiscal_year).filter(Boolean))] as number[]
  availableYears.sort((a, b) => b - a)

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.contractor_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesYear = yearFilter === 'all' || project.fiscal_year === yearFilter
    return matchesSearch && matchesStatus && matchesYear
  })

  const handleCreateProject = async () => {
    try {
      await createProject({
        name: formData.name,
        description: formData.description || null,
        area_polygon: null,
        status: 'planned',
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        fiscal_year: formData.fiscal_year,
        project_number: formData.project_number || null,
        client_name: formData.client_name || null,
        contractor_name: formData.contractor_name || null,
        coordinate_system: formData.coordinate_system || null,
        created_by: null,
      })
      setIsDialogOpen(false)
      setFormData(initialFormData)
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('工事の追加に失敗しました: ' + (error as Error).message)
    }
  }

  const openCreateDialog = () => {
    setFormData({
      ...initialFormData,
      fiscal_year: currentYear,
    })
    setIsDialogOpen(true)
  }

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工事一覧</h1>
          <p className="text-muted-foreground">全ての工事案件を管理します</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          新規工事
        </Button>
      </div>

      {/* フィルター */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="工事名、工事番号、発注者、受注者で検索..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={yearFilter === 'all' ? 'all' : String(yearFilter)}
              onValueChange={(value) => setYearFilter(value === 'all' ? 'all' : Number(value))}
            >
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="年度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全年度</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}年度
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ProjectStatus | 'all')}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="planned">計画中</SelectItem>
                <SelectItem value="active">進行中</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="suspended">中断</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 工事リスト */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredProjects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || yearFilter !== 'all'
                  ? '条件に一致する工事が見つかりません'
                  : '工事がありません'}
              </p>
              <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                工事を追加
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {project.fiscal_year && (
                          <Badge variant="outline">{project.fiscal_year}年度</Badge>
                        )}
                        {project.project_number && (
                          <Badge variant="secondary">{project.project_number}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {project.description || '説明なし'}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 発注者・受注者 */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">発注者: </span>
                        <span>{project.client_name || '未設定'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">受注者: </span>
                        <span>{project.contractor_name || '未設定'}</span>
                      </div>
                    </div>

                    {/* 工期 */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">工期</span>
                      <span>
                        {project.start_date || '未定'} 〜 {project.end_date || '未定'}
                      </span>
                    </div>

                    {/* 座標系 */}
                    {project.coordinate_system && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{project.coordinate_system}</span>
                      </div>
                    )}

                    {/* 進捗 */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">全体進捗</span>
                        <span className="font-medium">
                          {project.status === 'completed' ? '100' : project.status === 'planned' ? '0' : '65'}%
                        </span>
                      </div>
                      <Progress
                        value={project.status === 'completed' ? 100 : project.status === 'planned' ? 0 : 65}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* 工事追加ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新規工事の追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fiscal_year">年度 *</Label>
                <Input
                  id="fiscal_year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={formData.fiscal_year}
                  onChange={(e) =>
                    setFormData({ ...formData, fiscal_year: parseInt(e.target.value) || currentYear })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_number">工事番号</Label>
                <Input
                  id="project_number"
                  value={formData.project_number}
                  onChange={(e) =>
                    setFormData({ ...formData, project_number: e.target.value })
                  }
                  placeholder="R6-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">工事名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="令和○年度 ○○地区農地整備事業"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">発注者名</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) =>
                    setFormData({ ...formData, client_name: e.target.value })
                  }
                  placeholder="北海道開発局"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractor_name">受注者名</Label>
                <Input
                  id="contractor_name"
                  value={formData.contractor_name}
                  onChange={(e) =>
                    setFormData({ ...formData, contractor_name: e.target.value })
                  }
                  placeholder="株式会社○○建設"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">工期開始</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">工期終了</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinate_system">座標系</Label>
              <Select
                value={formData.coordinate_system}
                onValueChange={(v) => setFormData({ ...formData, coordinate_system: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="座標系を選択" />
                </SelectTrigger>
                <SelectContent>
                  {COORDINATE_SYSTEMS.map((cs) => (
                    <SelectItem key={cs.value} value={cs.value}>
                      {cs.value} - {cs.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">備考</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="工事の詳細や特記事項など"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!formData.name.trim() || !formData.fiscal_year}
            >
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

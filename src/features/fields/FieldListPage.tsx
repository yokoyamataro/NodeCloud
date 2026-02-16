import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Map, UserPlus, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFieldStore } from '@/stores/fieldStore'
import { useProjectStore, useSelectedProjectStore } from '@/stores/projectStore'

const SOIL_TYPES = [
  '黒ボク土',
  '褐色森林土',
  '泥炭土',
  'グライ土',
  '灰色低地土',
  '沖積土',
  'その他',
]

interface WorkAreaInput {
  work_type_id: string
  area_hectares: number
}

interface FieldFormData {
  farmer_id: string
  field_number: number
  area_hectares: number
  soil_type: string
  notes: string
  workAreas: WorkAreaInput[]
}

const initialFormData: FieldFormData = {
  farmer_id: '',
  field_number: 1,
  area_hectares: 0,
  soil_type: '',
  notes: '',
  workAreas: [],
}

interface FarmerFormData {
  project_id: string
  farmer_number: number
  name: string
  address: string
  email: string
  phone: string
  mobile_phone: string
  notes: string
}

const initialFarmerFormData: FarmerFormData = {
  project_id: '',
  farmer_number: 1,
  name: '',
  address: '',
  email: '',
  phone: '',
  mobile_phone: '',
  notes: '',
}

export function FieldListPage() {
  const navigate = useNavigate()
  const {
    fields,
    farmers,
    projectFields,
    workTypes,
    isLoading,
    fetchFields,
    fetchFarmers,
    fetchProjectFields,
    fetchWorkTypes,
    createField,
    createFarmer,
    createFieldWorkArea,
  } = useFieldStore()
  const { projects, fetchProjects } = useProjectStore()
  const { selectedProjectId } = useSelectedProjectStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterFarmer, setFilterFarmer] = useState<string>('all')
  const [filterPolygon, setFilterPolygon] = useState<'all' | 'with' | 'without'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFarmerDialogOpen, setIsFarmerDialogOpen] = useState(false)
  const [formData, setFormData] = useState<FieldFormData>(initialFormData)
  const [farmerFormData, setFarmerFormData] = useState<FarmerFormData>(initialFarmerFormData)

  useEffect(() => {
    fetchProjects()
    fetchWorkTypes()
  }, [fetchProjects, fetchWorkTypes])

  useEffect(() => {
    if (selectedProjectId) {
      fetchFields(selectedProjectId)
      fetchFarmers(selectedProjectId)
      fetchProjectFields(selectedProjectId)
    }
  }, [selectedProjectId, fetchFields, fetchFarmers, fetchProjectFields])

  const filteredFields = useMemo(() => {
    return fields.filter((field) => {
      const matchesSearch =
        field.farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${field.farmer.farmer_number}-${field.field_number}`.includes(searchQuery) ||
        field.soil_type?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFarmer = filterFarmer === 'all' || field.farmer_id === filterFarmer

      const matchesPolygon =
        filterPolygon === 'all' ||
        (filterPolygon === 'with' && field.area_polygon) ||
        (filterPolygon === 'without' && !field.area_polygon)

      return matchesSearch && matchesFarmer && matchesPolygon
    })
  }, [fields, searchQuery, filterFarmer, filterPolygon])

  // 圃場を農家番号・圃場番号でソート
  const sortedFields = useMemo(() => {
    return [...filteredFields].sort((a, b) => {
      const aLabel = `${a.farmer.farmer_number}-${a.field_number}`
      const bLabel = `${b.farmer.farmer_number}-${b.field_number}`
      return aLabel.localeCompare(bLabel, 'ja', { numeric: true })
    })
  }, [filteredFields])

  const handleCreateField = async () => {
    try {
      const newField = await createField(
        {
          farmer_id: formData.farmer_id,
          field_number: formData.field_number,
          area_hectares: formData.area_hectares || null,
          soil_type: formData.soil_type || null,
          notes: formData.notes || null,
          area_polygon: null,
        },
        formData.farmer_id
      )

      // 工種別面積を登録
      for (const workArea of formData.workAreas) {
        if (workArea.area_hectares > 0) {
          await createFieldWorkArea({
            field_id: newField.id,
            work_type_id: workArea.work_type_id,
            area_hectares: workArea.area_hectares,
            notes: null,
          })
        }
      }

      // 圃場一覧を再取得
      await fetchFields()

      setIsDialogOpen(false)
      setFormData(initialFormData)
    } catch (error) {
      console.error('Failed to create field:', error)
      alert('圃場の追加に失敗しました: ' + (error as Error).message)
    }
  }

  const handleCreateFarmer = async () => {
    try {
      if (!farmerFormData.project_id) {
        alert('工事を選択してください')
        return
      }

      // contact_infoから空の値を除外
      const contactInfo: Record<string, string> = {}
      if (farmerFormData.address) contactInfo.address = farmerFormData.address
      if (farmerFormData.email) contactInfo.email = farmerFormData.email
      if (farmerFormData.phone) contactInfo.phone = farmerFormData.phone
      if (farmerFormData.mobile_phone) contactInfo.mobile_phone = farmerFormData.mobile_phone
      if (farmerFormData.notes) contactInfo.notes = farmerFormData.notes

      await createFarmer({
        farmer_number: farmerFormData.farmer_number,
        project_id: farmerFormData.project_id,
        name: farmerFormData.name,
        contact_info: Object.keys(contactInfo).length > 0 ? contactInfo : null,
      })

      // 農家一覧を再取得
      await fetchFarmers()

      setIsFarmerDialogOpen(false)
      setFarmerFormData({
        ...initialFarmerFormData,
        farmer_number: farmers.length + 2, // 次の番号を自動設定
      })
    } catch (error) {
      console.error('Failed to create farmer:', error)
      alert('農家の追加に失敗しました: ' + (error as Error).message)
    }
  }

  // 農家追加ダイアログを開く際に次の番号と選択中の工事を設定
  const openFarmerDialog = () => {
    const maxNumber = farmers.reduce((max, f) => Math.max(max, f.farmer_number), 0)
    setFarmerFormData({
      ...initialFarmerFormData,
      farmer_number: maxNumber + 1,
      project_id: selectedProjectId || '',
    })
    setIsFarmerDialogOpen(true)
  }

  // 圃場の進捗状況を取得
  const getFieldProgress = (fieldId: string): number => {
    const pf = projectFields.find((p) => p.field_id === fieldId)
    if (!pf || pf.assignments.length === 0) return 0
    return Math.round(
      pf.assignments.reduce((sum, a) => sum + a.progress_pct, 0) / pf.assignments.length
    )
  }

  // 圃場の工種別面積を取得（projectFieldsから）
  const getFieldWorkAreas = (fieldId: string): { name: string; area: number | null; color: string }[] => {
    const pf = projectFields.find((p) => p.field_id === fieldId)
    if (!pf) return []
    return pf.assignments.map((a) => ({
      name: a.work_type.name,
      area: null, // TODO: field_work_areasから取得
      color: a.work_type.color || '#6B7280',
    }))
  }

  // 圃場の作付けを取得（現状はダミー）
  const getFieldCrops = (_fieldId: string): string[] => {
    // TODO: fieldCropsから取得
    return []
  }

  const fieldsWithPolygon = fields.filter((f) => f.area_polygon).length
  const fieldsWithoutPolygon = fields.filter((f) => !f.area_polygon).length

  // 選択中の工事を取得
  const selectedProject = projects.find(p => p.id === selectedProjectId)

  // 工事が選択されていない場合
  if (!selectedProjectId || !selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">圃場一覧</h1>
          <p className="text-muted-foreground">
            登録されている圃場の情報を管理します
          </p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">工事を選択してください</p>
          <p className="text-sm text-muted-foreground mt-2">
            ヘッダーから工事を選択すると、その工事の圃場が表示されます
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">圃場一覧</h1>
          <p className="text-muted-foreground">
            {selectedProject.fiscal_year && `${selectedProject.fiscal_year}年度 `}
            {selectedProject.name} の圃場を管理します
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openFarmerDialog}>
            <UserPlus className="mr-2 h-4 w-4" />
            農家を追加
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            圃場を追加
          </Button>
        </div>
      </div>

      {/* フィルター・検索 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="圃場番号、農家名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterFarmer} onValueChange={setFilterFarmer}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="農家で絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての農家</SelectItem>
            {farmers.map((farmer) => (
              <SelectItem key={farmer.id} value={farmer.id}>
                {farmer.farmer_number}. {farmer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPolygon} onValueChange={(v) => setFilterPolygon(v as 'all' | 'with' | 'without')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="ポリゴン" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="with">設定済み</SelectItem>
            <SelectItem value="without">未設定</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">総圃場数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fields.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">農家数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{farmers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ポリゴン設定済</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{fieldsWithPolygon}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ポリゴン未設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{fieldsWithoutPolygon}</div>
          </CardContent>
        </Card>
      </div>

      {/* 圃場一覧（テーブル） */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : sortedFields.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <Map className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">圃場が見つかりません</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            圃場を追加
          </Button>
        </div>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">圃場番号</TableHead>
                <TableHead className="w-[120px]">受益者名</TableHead>
                <TableHead>工種</TableHead>
                <TableHead className="w-[120px]">作付け</TableHead>
                <TableHead className="w-[150px]">進捗状況</TableHead>
                <TableHead className="w-[80px]">地図</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFields.map((field) => {
                const progress = getFieldProgress(field.id)
                const workAreas = getFieldWorkAreas(field.id)
                const crops = getFieldCrops(field.id)
                return (
                  <TableRow
                    key={field.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/fields/${field.id}`)}
                  >
                    <TableCell className="font-medium">
                      {field.farmer.farmer_number}-{field.field_number}
                    </TableCell>
                    <TableCell>{field.farmer.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {workAreas.length > 0 ? (
                          workAreas.map((wa, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              style={{
                                borderColor: wa.color,
                                backgroundColor: `${wa.color}20`,
                              }}
                            >
                              {wa.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {crops.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {crops.map((crop, idx) => (
                            <Badge key={idx} variant="secondary">
                              {crop}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {field.area_polygon ? (
                        <Badge variant="default" className="bg-green-100 text-green-700">
                          <MapPin className="h-3 w-3 mr-1" />
                          済
                        </Badge>
                      ) : (
                        <Badge variant="secondary">未</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 圃場追加ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>圃場を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="farmer_id">農家 *</Label>
              <Select
                value={formData.farmer_id}
                onValueChange={(v) => {
                  // 選択した農家の既存圃場番号の最大値を取得し、+1を設定
                  const farmerFields = fields.filter((f) => f.farmer_id === v)
                  const maxFieldNumber = farmerFields.reduce(
                    (max, f) => Math.max(max, f.field_number),
                    0
                  )
                  setFormData({ ...formData, farmer_id: v, field_number: maxFieldNumber + 1 })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="農家を選択" />
                </SelectTrigger>
                <SelectContent>
                  {farmers.map((farmer) => (
                    <SelectItem key={farmer.id} value={farmer.id}>
                      {farmer.farmer_number}. {farmer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field_number">圃場番号 *</Label>
                <Input
                  id="field_number"
                  type="number"
                  min={1}
                  value={formData.field_number}
                  onChange={(e) =>
                    setFormData({ ...formData, field_number: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area_hectares">面積 (ha)</Label>
                <Input
                  id="area_hectares"
                  type="number"
                  step="0.1"
                  min={0}
                  value={formData.area_hectares || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, area_hectares: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="soil_type">土壌タイプ</Label>
              <Select
                value={formData.soil_type}
                onValueChange={(v) => setFormData({ ...formData, soil_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {SOIL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">備考</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            {/* 工種別面積 */}
            <div className="space-y-2">
              <Label>工種別面積 (ha)</Label>
              <div className="grid grid-cols-2 gap-2">
                {workTypes.map((wt) => {
                  const workArea = formData.workAreas.find((wa) => wa.work_type_id === wt.id)
                  return (
                    <div key={wt.id} className="flex items-center gap-2">
                      <Label className="w-16 text-sm">{wt.name}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        value={workArea?.area_hectares || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          const newWorkAreas = formData.workAreas.filter(
                            (wa) => wa.work_type_id !== wt.id
                          )
                          if (value > 0) {
                            newWorkAreas.push({ work_type_id: wt.id, area_hectares: value })
                          }
                          setFormData({ ...formData, workAreas: newWorkAreas })
                        }}
                        className="h-8"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreateField}
              disabled={!formData.farmer_id || !formData.field_number}
            >
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 農家追加ダイアログ */}
      <Dialog open={isFarmerDialogOpen} onOpenChange={setIsFarmerDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>農家を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="farmer_project_id">工事 *</Label>
              <Select
                value={farmerFormData.project_id}
                onValueChange={(v) => setFarmerFormData({ ...farmerFormData, project_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="工事を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.fiscal_year && `${project.fiscal_year}年度 `}
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  工事が登録されていません。先に工事を追加してください。
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farmer_number">番号 *</Label>
                <Input
                  id="farmer_number"
                  type="number"
                  min={1}
                  value={farmerFormData.farmer_number}
                  onChange={(e) =>
                    setFarmerFormData({ ...farmerFormData, farmer_number: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmer_name">名前 *</Label>
                <Input
                  id="farmer_name"
                  value={farmerFormData.name}
                  onChange={(e) =>
                    setFarmerFormData({ ...farmerFormData, name: e.target.value })
                  }
                  placeholder="山田農場"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmer_address">住所</Label>
              <Input
                id="farmer_address"
                value={farmerFormData.address}
                onChange={(e) =>
                  setFarmerFormData({ ...farmerFormData, address: e.target.value })
                }
                placeholder="北海道旭川市..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmer_email">メールアドレス</Label>
              <Input
                id="farmer_email"
                type="email"
                value={farmerFormData.email}
                onChange={(e) =>
                  setFarmerFormData({ ...farmerFormData, email: e.target.value })
                }
                placeholder="example@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farmer_phone">電話番号</Label>
                <Input
                  id="farmer_phone"
                  type="tel"
                  value={farmerFormData.phone}
                  onChange={(e) =>
                    setFarmerFormData({ ...farmerFormData, phone: e.target.value })
                  }
                  placeholder="0166-12-3456"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmer_mobile_phone">携帯電話番号</Label>
                <Input
                  id="farmer_mobile_phone"
                  type="tel"
                  value={farmerFormData.mobile_phone}
                  onChange={(e) =>
                    setFarmerFormData({ ...farmerFormData, mobile_phone: e.target.value })
                  }
                  placeholder="090-1234-5678"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmer_notes">備考</Label>
              <Textarea
                id="farmer_notes"
                value={farmerFormData.notes}
                onChange={(e) => setFarmerFormData({ ...farmerFormData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFarmerDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreateFarmer}
              disabled={!farmerFormData.project_id || !farmerFormData.farmer_number || !farmerFormData.name.trim()}
            >
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

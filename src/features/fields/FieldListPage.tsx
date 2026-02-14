import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MapPin, Ruler, User, ChevronRight, Map } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFieldStore } from '@/stores/fieldStore'
import type { FieldWithFarmer } from '@/types/database'

const SOIL_TYPES = [
  '黒ボク土',
  '褐色森林土',
  '泥炭土',
  'グライ土',
  '灰色低地土',
  '沖積土',
  'その他',
]

interface FieldFormData {
  farmer_id: string
  field_number: number
  area_hectares: number
  soil_type: string
  notes: string
}

const initialFormData: FieldFormData = {
  farmer_id: '',
  field_number: 1,
  area_hectares: 0,
  soil_type: '',
  notes: '',
}

export function FieldListPage() {
  const navigate = useNavigate()
  const {
    fields,
    farmers,
    projectFields,
    isLoading,
    fetchFields,
    fetchFarmers,
    fetchProjectFields,
    createField,
  } = useFieldStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterFarmer, setFilterFarmer] = useState<string>('all')
  const [filterPolygon, setFilterPolygon] = useState<'all' | 'with' | 'without'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<FieldFormData>(initialFormData)

  useEffect(() => {
    fetchFields()
    fetchFarmers()
    fetchProjectFields('project-1')
  }, [fetchFields, fetchFarmers, fetchProjectFields])

  const filteredFields = fields.filter((field) => {
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

  // 農家ごとにグループ化
  const groupedFields = filteredFields.reduce<Record<string, FieldWithFarmer[]>>((acc, field) => {
    const farmerId = field.farmer_id
    if (!acc[farmerId]) {
      acc[farmerId] = []
    }
    acc[farmerId].push(field)
    return acc
  }, {})

  const handleCreateField = async () => {
    try {
      await createField(
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
      setIsDialogOpen(false)
      setFormData(initialFormData)
    } catch (error) {
      console.error('Failed to create field:', error)
    }
  }

  const getFieldProgress = (fieldId: string): number => {
    const pf = projectFields.find((p) => p.field_id === fieldId)
    if (!pf || pf.assignments.length === 0) return 0
    return Math.round(
      pf.assignments.reduce((sum, a) => sum + a.progress_pct, 0) / pf.assignments.length
    )
  }

  const fieldsWithPolygon = fields.filter((f) => f.area_polygon).length
  const fieldsWithoutPolygon = fields.filter((f) => !f.area_polygon).length

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">圃場一覧</h1>
          <p className="text-muted-foreground">
            登録されている圃場の情報を管理します
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          圃場を追加
        </Button>
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

      {/* 圃場一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredFields.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <Map className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">圃場が見つかりません</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            圃場を追加
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFields).map(([farmerId, farmerFields]) => {
            const farmer = farmerFields[0]?.farmer
            if (!farmer) return null

            return (
              <div key={farmerId}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>{farmer.farmer_number}. {farmer.name}</span>
                  <Badge variant="secondary">{farmerFields.length}圃場</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {farmerFields.map((field) => {
                    const progress = getFieldProgress(field.id)
                    return (
                      <Card
                        key={field.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/fields/${field.id}`)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="text-lg font-bold">
                                {field.farmer.farmer_number}-{field.field_number}
                              </span>
                              {field.area_polygon ? (
                                <Badge variant="default" className="bg-green-100 text-green-700">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  設定済
                                </Badge>
                              ) : (
                                <Badge variant="secondary">未設定</Badge>
                              )}
                            </CardTitle>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {field.area_hectares && (
                              <div className="flex items-center gap-1">
                                <Ruler className="h-4 w-4" />
                                {field.area_hectares} ha
                              </div>
                            )}
                            {field.soil_type && (
                              <div>{field.soil_type}</div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">進捗</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
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
                onValueChange={(v) => setFormData({ ...formData, farmer_id: v })}
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
    </div>
  )
}

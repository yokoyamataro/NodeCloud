import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Ruler, FileText, Pencil, Trash2, Save, X, User, Building2, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { PolygonEditor } from '@/components/map/PolygonEditor'
import { CoordinateInput } from '@/components/map/CoordinateInput'
import { useFieldStore } from '@/stores/fieldStore'
import type { FieldWithFarmer, ProjectFieldWithDetails, FieldWorkStatus } from '@/types/database'

const SOIL_TYPES = [
  '黒ボク土',
  '褐色森林土',
  '泥炭土',
  'グライ土',
  '灰色低地土',
  '沖積土',
  'その他',
]

const STATUS_CONFIG: Record<FieldWorkStatus, { label: string; color: string; icon: React.ElementType }> = {
  not_started: { label: '未着手', color: 'bg-gray-100 text-gray-700', icon: Clock },
  in_progress: { label: '進行中', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  completed: { label: '完了', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  on_hold: { label: '保留', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
}

export function FieldDetailPage() {
  const { fieldId } = useParams<{ fieldId: string }>()
  const navigate = useNavigate()
  const {
    fields,
    projectFields,
    fetchFields,
    fetchProjectFields,
    updateField,
    updateFieldPolygon,
    deleteField,
    getFieldById,
  } = useFieldStore()

  const [field, setField] = useState<FieldWithFarmer | null>(null)
  const [projectField, setProjectField] = useState<ProjectFieldWithDetails | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPolygonEditing, setIsPolygonEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editData, setEditData] = useState({
    field_number: 0,
    area_hectares: 0,
    soil_type: '',
    notes: '',
  })

  useEffect(() => {
    fetchFields()
    fetchProjectFields('project-1')
  }, [fetchFields, fetchProjectFields])

  useEffect(() => {
    if (fieldId && fields.length > 0) {
      const foundField = getFieldById(fieldId)
      if (foundField) {
        setField(foundField)
        setEditData({
          field_number: foundField.field_number,
          area_hectares: foundField.area_hectares || 0,
          soil_type: foundField.soil_type || '',
          notes: foundField.notes || '',
        })
      }

      const foundProjectField = projectFields.find((pf) => pf.field_id === fieldId)
      if (foundProjectField) {
        setProjectField(foundProjectField)
      }
    }
  }, [fieldId, fields, projectFields, getFieldById])

  const handleSaveEdit = async () => {
    if (!field) return
    try {
      await updateField(field.id, {
        field_number: editData.field_number,
        area_hectares: editData.area_hectares || null,
        soil_type: editData.soil_type || null,
        notes: editData.notes || null,
      })
      setField({ ...field, ...editData })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update field:', error)
    }
  }

  const handleSavePolygon = async (polygon: GeoJSON.Polygon | null) => {
    if (!field) return
    try {
      // Json型としてキャスト
      await updateFieldPolygon(field.id, polygon as unknown as typeof field.area_polygon)
      setField({ ...field, area_polygon: polygon as unknown as typeof field.area_polygon })
      setIsPolygonEditing(false)
    } catch (error) {
      console.error('Failed to update polygon:', error)
    }
  }

  const handleApplyCoordinatePolygon = (polygon: GeoJSON.Polygon) => {
    if (!field) return
    handleSavePolygon(polygon)
  }

  const handleDelete = async () => {
    if (!field) return
    try {
      await deleteField(field.id)
      navigate(-1)
    } catch (error) {
      console.error('Failed to delete field:', error)
    }
  }

  if (!field) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalProgress = projectField
    ? Math.round(
        projectField.assignments.reduce((sum, a) => sum + a.progress_pct, 0) /
        projectField.assignments.length
      )
    : 0

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                圃場 {field.farmer.farmer_number}-{field.field_number}
              </h1>
              {field.area_polygon ? (
                <Badge variant="default" className="bg-green-100 text-green-700">
                  <MapPin className="h-3 w-3 mr-1" />
                  ポリゴン設定済
                </Badge>
              ) : (
                <Badge variant="secondary">
                  ポリゴン未設定
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              {field.farmer.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            編集
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            削除
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：基本情報 */}
        <div className="space-y-6">
          {/* 基本情報カード */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">農家番号</p>
                  <p className="font-medium">{field.farmer.farmer_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">圃場番号</p>
                  <p className="font-medium">{field.field_number}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Ruler className="h-3 w-3" />
                  面積
                </p>
                <p className="font-medium">
                  {field.area_hectares ? `${field.area_hectares} ha` : '未設定'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">土壌タイプ</p>
                <p className="font-medium">{field.soil_type || '未設定'}</p>
              </div>
              {field.notes && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    備考
                  </p>
                  <p className="text-sm">{field.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 農家情報カード */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                農家情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">農家名</p>
                <p className="font-medium">{field.farmer.name}</p>
              </div>
              {field.farmer.contact_info && (
                <>
                  {(field.farmer.contact_info as { phone?: string }).phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">電話番号</p>
                      <p className="font-medium">
                        {(field.farmer.contact_info as { phone: string }).phone}
                      </p>
                    </div>
                  )}
                  {(field.farmer.contact_info as { address?: string }).address && (
                    <div>
                      <p className="text-sm text-muted-foreground">住所</p>
                      <p className="text-sm">
                        {(field.farmer.contact_info as { address: string }).address}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* 工種別進捗 */}
          {projectField && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  工種別進捗
                </CardTitle>
                <CardDescription>
                  全体進捗: {totalProgress}%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={totalProgress} className="h-2" />
                <div className="space-y-3">
                  {projectField.assignments.map((assignment) => {
                    const StatusIcon = STATUS_CONFIG[assignment.status].icon
                    return (
                      <div key={assignment.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: assignment.work_type.color || '#9CA3AF' }}
                            />
                            <span className="text-sm font-medium">
                              {assignment.work_type.name}
                            </span>
                          </div>
                          <Badge className={STATUS_CONFIG[assignment.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {STATUS_CONFIG[assignment.status].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={assignment.progress_pct} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-10">
                            {assignment.progress_pct}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側：地図とポリゴン設定 */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="map">
            <TabsList>
              <TabsTrigger value="map">地図で描画</TabsTrigger>
              <TabsTrigger value="coordinates">座標入力</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">ポリゴン設定</CardTitle>
                      <CardDescription>
                        地図上で圃場の境界を描画できます
                      </CardDescription>
                    </div>
                    {!isPolygonEditing && (
                      <Button onClick={() => setIsPolygonEditing(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        編集
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <PolygonEditor
                    initialPolygon={field.area_polygon as GeoJSON.Polygon | null}
                    onSave={handleSavePolygon}
                    onCancel={() => setIsPolygonEditing(false)}
                    readOnly={!isPolygonEditing}
                    className="h-[500px]"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coordinates">
              <CoordinateInput
                currentPolygon={field.area_polygon as GeoJSON.Polygon | null}
                onApply={handleApplyCoordinatePolygon}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 編集ダイアログ */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>圃場情報を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="field_number">圃場番号</Label>
                <Input
                  id="field_number"
                  type="number"
                  min={1}
                  value={editData.field_number}
                  onChange={(e) =>
                    setEditData({ ...editData, field_number: parseInt(e.target.value) || 0 })
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
                  value={editData.area_hectares}
                  onChange={(e) =>
                    setEditData({ ...editData, area_hectares: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="soil_type">土壌タイプ</Label>
              <Select
                value={editData.soil_type}
                onValueChange={(v) => setEditData({ ...editData, soil_type: v })}
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
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-2" />
              キャンセル
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>圃場を削除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              圃場「{field.farmer.farmer_number}-{field.field_number}」を削除してもよろしいですか？
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              この操作は取り消せません。関連する進捗データや日報も削除される可能性があります。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

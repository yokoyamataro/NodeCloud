import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Pencil, Trash2, Save, X, User, Calendar, CheckCircle2, Clock, AlertCircle, Plus, Wheat, Layers } from 'lucide-react'
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
import type { FieldWithFarmer, ProjectFieldWithDetails, FieldWorkStatus, FieldWorkAreaWithWorkType, FieldCropWithCropType, FieldWorkAssignmentWithDetails } from '@/types/database'

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
    workTypes,
    cropTypes,
    fieldWorkAreas,
    fieldCrops,
    fetchFields,
    fetchProjectFields,
    updateField,
    updateFieldPolygon,
    deleteField,
    getFieldById,
    fetchWorkTypes,
    fetchFieldWorkAreas,
    createFieldWorkArea,
    updateFieldWorkArea,
    deleteFieldWorkArea,
    fetchCropTypes,
    createCropType,
    fetchFieldCrops,
    createFieldCrop,
    updateFieldCrop,
    deleteFieldCrop,
    createFieldWorkAssignment,
    updateFieldWorkAssignment,
    deleteFieldWorkAssignment,
  } = useFieldStore()

  const [field, setField] = useState<FieldWithFarmer | null>(null)
  const [projectField, setProjectField] = useState<ProjectFieldWithDetails | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPolygonEditing, setIsPolygonEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editData, setEditData] = useState({
    field_number: '',
    area_hectares: 0,
    notes: '',
  })

  // 工種面積ダイアログの状態
  const [isWorkAreaDialogOpen, setIsWorkAreaDialogOpen] = useState(false)
  const [editingWorkArea, setEditingWorkArea] = useState<FieldWorkAreaWithWorkType | null>(null)
  const [workAreaForm, setWorkAreaForm] = useState({
    work_type_id: '',
    area_hectares: 0,
    notes: '',
  })

  // 作付けダイアログの状態
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)
  const [editingCrop, setEditingCrop] = useState<FieldCropWithCropType | null>(null)
  const [cropForm, setCropForm] = useState({
    crop_type_id: '',
    fiscal_year: new Date().getFullYear(),
    area_hectares: 0,
    notes: '',
  })

  // 作付け追加ダイアログ
  const [isNewCropTypeDialogOpen, setIsNewCropTypeDialogOpen] = useState(false)
  const [newCropTypeName, setNewCropTypeName] = useState('')

  // 工程管理ダイアログの状態
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<FieldWorkAssignmentWithDetails | null>(null)
  const [assignmentForm, setAssignmentForm] = useState({
    work_type_id: '',
    planned_start: '',
    planned_end: '',
    actual_start: '',
    actual_end: '',
    status: 'not_started' as FieldWorkStatus,
    progress_pct: 0,
    notes: '',
  })

  useEffect(() => {
    fetchFields()
    fetchProjectFields('project-1')
    fetchWorkTypes()
    fetchCropTypes()
  }, [fetchFields, fetchProjectFields, fetchWorkTypes, fetchCropTypes])

  useEffect(() => {
    if (fieldId) {
      fetchFieldWorkAreas(fieldId)
      fetchFieldCrops(fieldId)
    }
  }, [fieldId, fetchFieldWorkAreas, fetchFieldCrops])

  useEffect(() => {
    if (fieldId && fields.length > 0) {
      const foundField = getFieldById(fieldId)
      if (foundField) {
        setField(foundField)
        setEditData({
          field_number: foundField.field_number,
          area_hectares: foundField.area_hectares || 0,
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

  // 工種面積ハンドラー
  const handleOpenWorkAreaDialog = (workArea?: FieldWorkAreaWithWorkType) => {
    if (workArea) {
      setEditingWorkArea(workArea)
      setWorkAreaForm({
        work_type_id: workArea.work_type_id,
        area_hectares: workArea.area_hectares,
        notes: workArea.notes || '',
      })
    } else {
      setEditingWorkArea(null)
      setWorkAreaForm({
        work_type_id: '',
        area_hectares: 0,
        notes: '',
      })
    }
    setIsWorkAreaDialogOpen(true)
  }

  const handleSaveWorkArea = async () => {
    if (!field) return
    try {
      if (editingWorkArea) {
        await updateFieldWorkArea(editingWorkArea.id, {
          area_hectares: workAreaForm.area_hectares,
          notes: workAreaForm.notes || null,
        })
      } else {
        await createFieldWorkArea({
          field_id: field.id,
          work_type_id: workAreaForm.work_type_id,
          area_hectares: workAreaForm.area_hectares,
          notes: workAreaForm.notes || null,
        })
      }
      setIsWorkAreaDialogOpen(false)
    } catch (error) {
      console.error('Failed to save work area:', error)
    }
  }

  const handleDeleteWorkArea = async (id: string) => {
    try {
      await deleteFieldWorkArea(id)
    } catch (error) {
      console.error('Failed to delete work area:', error)
    }
  }

  // 作付けハンドラー
  const handleOpenCropDialog = (crop?: FieldCropWithCropType) => {
    if (crop) {
      setEditingCrop(crop)
      setCropForm({
        crop_type_id: crop.crop_type_id,
        fiscal_year: crop.fiscal_year || new Date().getFullYear(),
        area_hectares: crop.area_hectares || 0,
        notes: crop.notes || '',
      })
    } else {
      setEditingCrop(null)
      setCropForm({
        crop_type_id: '',
        fiscal_year: new Date().getFullYear(),
        area_hectares: 0,
        notes: '',
      })
    }
    setIsCropDialogOpen(true)
  }

  const handleSaveCrop = async () => {
    if (!field) return
    try {
      if (editingCrop) {
        await updateFieldCrop(editingCrop.id, {
          fiscal_year: cropForm.fiscal_year || null,
          area_hectares: cropForm.area_hectares || null,
          notes: cropForm.notes || null,
        })
      } else {
        await createFieldCrop({
          field_id: field.id,
          crop_type_id: cropForm.crop_type_id,
          fiscal_year: cropForm.fiscal_year || null,
          area_hectares: cropForm.area_hectares || null,
          notes: cropForm.notes || null,
        })
      }
      setIsCropDialogOpen(false)
    } catch (error) {
      console.error('Failed to save crop:', error)
    }
  }

  const handleDeleteCrop = async (id: string) => {
    try {
      await deleteFieldCrop(id)
    } catch (error) {
      console.error('Failed to delete crop:', error)
    }
  }

  // 作付けマスタ追加ハンドラー
  const handleAddNewCropType = async () => {
    if (!newCropTypeName.trim()) return
    try {
      await createCropType(newCropTypeName.trim())
      setNewCropTypeName('')
      setIsNewCropTypeDialogOpen(false)
    } catch (error) {
      console.error('Failed to create crop type:', error)
    }
  }

  // 既に登録されている工種を除いた工種リスト
  const availableWorkTypes = workTypes.filter(
    wt => !fieldWorkAreas.some(fwa => fwa.work_type_id === wt.id)
  )

  // 工程管理ハンドラー
  const handleOpenAssignmentDialog = (assignment?: FieldWorkAssignmentWithDetails) => {
    if (assignment) {
      setEditingAssignment(assignment)
      setAssignmentForm({
        work_type_id: assignment.work_type_id,
        planned_start: assignment.planned_start || '',
        planned_end: assignment.planned_end || '',
        actual_start: assignment.actual_start || '',
        actual_end: assignment.actual_end || '',
        status: assignment.status,
        progress_pct: assignment.progress_pct,
        notes: assignment.notes || '',
      })
    } else {
      setEditingAssignment(null)
      setAssignmentForm({
        work_type_id: '',
        planned_start: '',
        planned_end: '',
        actual_start: '',
        actual_end: '',
        status: 'not_started',
        progress_pct: 0,
        notes: '',
      })
    }
    setIsAssignmentDialogOpen(true)
  }

  const handleSaveAssignment = async () => {
    if (!projectField) return
    try {
      if (editingAssignment) {
        await updateFieldWorkAssignment(editingAssignment.id, {
          planned_start: assignmentForm.planned_start || null,
          planned_end: assignmentForm.planned_end || null,
          actual_start: assignmentForm.actual_start || null,
          actual_end: assignmentForm.actual_end || null,
          status: assignmentForm.status,
          progress_pct: assignmentForm.progress_pct,
          notes: assignmentForm.notes || null,
        })
      } else {
        await createFieldWorkAssignment(projectField.id, {
          work_type_id: assignmentForm.work_type_id,
          assigned_company_id: null,
          status: assignmentForm.status,
          progress_pct: assignmentForm.progress_pct,
          planned_start: assignmentForm.planned_start || null,
          planned_end: assignmentForm.planned_end || null,
          actual_start: assignmentForm.actual_start || null,
          actual_end: assignmentForm.actual_end || null,
          estimated_hours: null,
          actual_hours: 0,
          notes: assignmentForm.notes || null,
        })
      }
      setIsAssignmentDialogOpen(false)
      // projectFieldsを再取得して更新を反映
      if (field) {
        const updatedProjectField = projectFields.find((pf) => pf.field_id === field.id)
        if (updatedProjectField) {
          setProjectField(updatedProjectField)
        }
      }
    } catch (error) {
      console.error('Failed to save assignment:', error)
    }
  }

  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteFieldWorkAssignment(id)
    } catch (error) {
      console.error('Failed to delete assignment:', error)
    }
  }

  // 工程に登録されていない工種を取得
  const availableWorkTypesForAssignment = projectField
    ? workTypes.filter(wt => !projectField.assignments.some(a => a.work_type_id === wt.id))
    : workTypes

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
        {/* 左側：詳細情報 */}
        <div className="space-y-6">
          {/* 工種別面積 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  工種別面積
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenWorkAreaDialog()}
                  disabled={availableWorkTypes.length === 0}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  追加
                </Button>
              </div>
              <CardDescription>
                各工種の施工面積を管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fieldWorkAreas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  工種が登録されていません
                </p>
              ) : (
                <div className="space-y-2">
                  {fieldWorkAreas.map((fwa) => (
                    <div
                      key={fwa.id}
                      className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: fwa.work_type.color || '#9CA3AF' }}
                        />
                        <span className="text-sm font-medium">{fwa.work_type.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {fwa.area_hectares} ha
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenWorkAreaDialog(fwa)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteWorkArea(fwa.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 作付け */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wheat className="h-4 w-4" />
                  作付け
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenCropDialog()}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  追加
                </Button>
              </div>
              <CardDescription>
                作付け情報を管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fieldCrops.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  作付けが登録されていません
                </p>
              ) : (
                <div className="space-y-2">
                  {fieldCrops.map((fc) => (
                    <div
                      key={fc.id}
                      className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <Wheat className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">{fc.crop_type.name}</span>
                        {fc.fiscal_year && (
                          <Badge variant="outline" className="text-xs">
                            {fc.fiscal_year}年度
                          </Badge>
                        )}
                        {fc.area_hectares && (
                          <span className="text-sm text-muted-foreground">
                            {fc.area_hectares} ha
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenCropDialog(fc)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteCrop(fc.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 工程管理（工種別日程・進捗） */}
          {projectField && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      工程管理
                    </CardTitle>
                    <CardDescription>
                      全体進捗: {totalProgress || 0}%
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => handleOpenAssignmentDialog()}>
                    <Plus className="h-4 w-4 mr-1" />
                    工種を追加
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={totalProgress || 0} className="h-2" />
                {projectField.assignments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    工種が登録されていません
                  </p>
                ) : (
                  <div className="space-y-4">
                    {projectField.assignments.map((assignment) => {
                      const StatusIcon = STATUS_CONFIG[assignment.status].icon
                      return (
                        <div key={assignment.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: assignment.work_type.color || '#9CA3AF' }}
                              />
                              <span className="text-sm font-medium">
                                {assignment.work_type.name}
                              </span>
                              <Badge className={STATUS_CONFIG[assignment.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {STATUS_CONFIG[assignment.status].label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenAssignmentDialog(assignment)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteAssignment(assignment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={assignment.progress_pct} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-10">
                              {assignment.progress_pct}%
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">予定: </span>
                              {assignment.planned_start && assignment.planned_end ? (
                                <span>{assignment.planned_start} 〜 {assignment.planned_end}</span>
                              ) : (
                                <span className="text-muted-foreground">未設定</span>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground">実績: </span>
                              {assignment.actual_start ? (
                                <span>
                                  {assignment.actual_start}
                                  {assignment.actual_end ? ` 〜 ${assignment.actual_end}` : ' 〜'}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">未着手</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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
                    otherFields={fields}
                    currentFieldId={field.id}
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
                  type="text"
                  value={editData.field_number}
                  onChange={(e) => {
                    // 半角英数記号のみ許可
                    const value = e.target.value.replace(/[^\x20-\x7E]/g, '')
                    setEditData({ ...editData, field_number: value })
                  }}
                  placeholder="例: 1, 1-A, A1"
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

      {/* 工種面積ダイアログ */}
      <Dialog open={isWorkAreaDialogOpen} onOpenChange={setIsWorkAreaDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingWorkArea ? '工種面積を編集' : '工種面積を追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="work_type">工種</Label>
              {editingWorkArea ? (
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: editingWorkArea.work_type.color || '#9CA3AF' }}
                  />
                  <span>{editingWorkArea.work_type.name}</span>
                </div>
              ) : (
                <Select
                  value={workAreaForm.work_type_id}
                  onValueChange={(v) => setWorkAreaForm({ ...workAreaForm, work_type_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="工種を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkTypes.map((wt) => (
                      <SelectItem key={wt.id} value={wt.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: wt.color || '#9CA3AF' }}
                          />
                          {wt.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_area_hectares">面積 (ha)</Label>
              <Input
                id="work_area_hectares"
                type="number"
                step="0.01"
                min={0}
                value={workAreaForm.area_hectares}
                onChange={(e) =>
                  setWorkAreaForm({ ...workAreaForm, area_hectares: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work_area_notes">備考</Label>
              <Textarea
                id="work_area_notes"
                value={workAreaForm.notes}
                onChange={(e) => setWorkAreaForm({ ...workAreaForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWorkAreaDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSaveWorkArea}
              disabled={!editingWorkArea && !workAreaForm.work_type_id}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 作付けダイアログ */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingCrop ? '作付けを編集' : '作付けを追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="crop_type">作付け種類</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => setIsNewCropTypeDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  新規追加
                </Button>
              </div>
              {editingCrop ? (
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                  <Wheat className="h-4 w-4 text-amber-600" />
                  <span>{editingCrop.crop_type.name}</span>
                </div>
              ) : (
                <Select
                  value={cropForm.crop_type_id}
                  onValueChange={(v) => setCropForm({ ...cropForm, crop_type_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="作付け種類を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {cropTypes.map((ct) => (
                      <SelectItem key={ct.id} value={ct.id}>
                        {ct.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crop_fiscal_year">年度</Label>
                <Input
                  id="crop_fiscal_year"
                  type="number"
                  value={cropForm.fiscal_year}
                  onChange={(e) =>
                    setCropForm({ ...cropForm, fiscal_year: parseInt(e.target.value) || new Date().getFullYear() })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop_area_hectares">面積 (ha)</Label>
                <Input
                  id="crop_area_hectares"
                  type="number"
                  step="0.01"
                  min={0}
                  value={cropForm.area_hectares}
                  onChange={(e) =>
                    setCropForm({ ...cropForm, area_hectares: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="crop_notes">備考</Label>
              <Textarea
                id="crop_notes"
                value={cropForm.notes}
                onChange={(e) => setCropForm({ ...cropForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSaveCrop}
              disabled={!editingCrop && !cropForm.crop_type_id}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 作付け種類追加ダイアログ */}
      <Dialog open={isNewCropTypeDialogOpen} onOpenChange={setIsNewCropTypeDialogOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>作付け種類を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_crop_type_name">種類名</Label>
              <Input
                id="new_crop_type_name"
                value={newCropTypeName}
                onChange={(e) => setNewCropTypeName(e.target.value)}
                placeholder="例: そば"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCropTypeDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleAddNewCropType}
              disabled={!newCropTypeName.trim()}
            >
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 工程管理ダイアログ */}
      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment ? '工程を編集' : '工程を追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>工種</Label>
              {editingAssignment ? (
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: editingAssignment.work_type.color || '#9CA3AF' }}
                  />
                  <span>{editingAssignment.work_type.name}</span>
                </div>
              ) : (
                <Select
                  value={assignmentForm.work_type_id}
                  onValueChange={(v) => setAssignmentForm({ ...assignmentForm, work_type_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="工種を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkTypesForAssignment.map((wt) => (
                      <SelectItem key={wt.id} value={wt.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: wt.color || '#9CA3AF' }}
                          />
                          {wt.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planned_start">予定着工日</Label>
                <Input
                  id="planned_start"
                  type="date"
                  value={assignmentForm.planned_start}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, planned_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planned_end">予定完了日</Label>
                <Input
                  id="planned_end"
                  type="date"
                  value={assignmentForm.planned_end}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, planned_end: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actual_start">実績着工日</Label>
                <Input
                  id="actual_start"
                  type="date"
                  value={assignmentForm.actual_start}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, actual_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual_end">実績完了日</Label>
                <Input
                  id="actual_end"
                  type="date"
                  value={assignmentForm.actual_end}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, actual_end: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignment_status">ステータス</Label>
                <Select
                  value={assignmentForm.status}
                  onValueChange={(v) => setAssignmentForm({ ...assignmentForm, status: v as FieldWorkStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress_pct">進捗 (%)</Label>
                <Input
                  id="progress_pct"
                  type="number"
                  min={0}
                  max={100}
                  value={assignmentForm.progress_pct}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, progress_pct: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment_notes">備考</Label>
              <Textarea
                id="assignment_notes"
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSaveAssignment}
              disabled={!editingAssignment && !assignmentForm.work_type_id}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

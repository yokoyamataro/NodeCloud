import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Pencil, Trash2, Save, X, Plus, Wheat, Layers, User, ChevronDown, ChevronRight } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { PolygonEditor } from '@/components/map/PolygonEditor'
import { CoordinateInput } from '@/components/map/CoordinateInput'
import { useFieldStore } from '@/stores/fieldStore'
import type { FieldWithFarmer, FieldWorkAreaWithWorkType, WorkAreaSubProcess } from '@/types/database'

export function FieldDetailPage() {
  const { fieldId } = useParams<{ fieldId: string }>()
  const navigate = useNavigate()
  const {
    fields,
    workTypes,
    cropTypes,
    fieldWorkAreas,
    fieldCrops,
    fetchFields,
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
    deleteFieldCrop,
    subProcesses,
    fetchSubProcesses,
    createSubProcess,
    updateSubProcess,
    deleteSubProcess,
  } = useFieldStore()

  const [field, setField] = useState<FieldWithFarmer | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isPolygonEditing, setIsPolygonEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editData, setEditData] = useState({
    field_number: '',
    area_hectares: 0,
    notes: '',
  })

  // 工種ダイアログの状態
  const [isWorkAreaDialogOpen, setIsWorkAreaDialogOpen] = useState(false)
  const [editingWorkArea, setEditingWorkArea] = useState<FieldWorkAreaWithWorkType | null>(null)
  const [workAreaForm, setWorkAreaForm] = useState({
    work_type_id: '',
    area_hectares: 0,
    notes: '',
    planned_start: '',
    planned_end: '',
    actual_start: '',
    actual_end: '',
  })

  // 作付けダイアログの状態
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false)
  const [selectedCropTypeIds, setSelectedCropTypeIds] = useState<string[]>([])

  // 作付け追加ダイアログ
  const [isNewCropTypeDialogOpen, setIsNewCropTypeDialogOpen] = useState(false)
  const [newCropTypeName, setNewCropTypeName] = useState('')

  // 細部工程の状態
  const [expandedWorkAreaId, setExpandedWorkAreaId] = useState<string | null>(null)
  const [isSubProcessDialogOpen, setIsSubProcessDialogOpen] = useState(false)
  const [editingSubProcess, setEditingSubProcess] = useState<WorkAreaSubProcess | null>(null)
  const [subProcessForm, setSubProcessForm] = useState({
    field_work_area_id: '',
    name: '',
    display_order: 0,
    planned_start: '',
    planned_end: '',
    actual_start: '',
    actual_end: '',
    notes: '',
  })

  useEffect(() => {
    fetchFields()
    fetchWorkTypes()
    fetchCropTypes()
  }, [fetchFields, fetchWorkTypes, fetchCropTypes])

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

    }
  }, [fieldId, fields, getFieldById])

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

  // 工種ハンドラー
  const handleOpenWorkAreaDialog = (workArea?: FieldWorkAreaWithWorkType) => {
    if (workArea) {
      setEditingWorkArea(workArea)
      setWorkAreaForm({
        work_type_id: workArea.work_type_id,
        area_hectares: workArea.area_hectares,
        notes: workArea.notes || '',
        planned_start: workArea.planned_start || '',
        planned_end: workArea.planned_end || '',
        actual_start: workArea.actual_start || '',
        actual_end: workArea.actual_end || '',
      })
    } else {
      setEditingWorkArea(null)
      setWorkAreaForm({
        work_type_id: '',
        area_hectares: 0,
        notes: '',
        planned_start: '',
        planned_end: '',
        actual_start: '',
        actual_end: '',
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
          planned_start: workAreaForm.planned_start || null,
          planned_end: workAreaForm.planned_end || null,
          actual_start: workAreaForm.actual_start || null,
          actual_end: workAreaForm.actual_end || null,
        })
      } else {
        await createFieldWorkArea({
          field_id: field.id,
          work_type_id: workAreaForm.work_type_id,
          area_hectares: workAreaForm.area_hectares,
          notes: workAreaForm.notes || null,
          planned_start: workAreaForm.planned_start || null,
          planned_end: workAreaForm.planned_end || null,
          actual_start: workAreaForm.actual_start || null,
          actual_end: workAreaForm.actual_end || null,
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
  const handleOpenCropDialog = () => {
    // 現在登録されている作付けIDをセット
    setSelectedCropTypeIds(fieldCrops.map(fc => fc.crop_type_id))
    setIsCropDialogOpen(true)
  }

  const handleToggleCropType = (cropTypeId: string) => {
    setSelectedCropTypeIds(prev =>
      prev.includes(cropTypeId)
        ? prev.filter(id => id !== cropTypeId)
        : [...prev, cropTypeId]
    )
  }

  const handleSaveCrops = async () => {
    if (!field) return
    try {
      // 現在登録されている作付けIDのリスト
      const currentCropTypeIds = fieldCrops.map(fc => fc.crop_type_id)

      // 削除する作付け（現在あるが、選択されていないもの）
      const toDelete = fieldCrops.filter(fc => !selectedCropTypeIds.includes(fc.crop_type_id))

      // 追加する作付け（選択されているが、現在ないもの）
      const toAdd = selectedCropTypeIds.filter(id => !currentCropTypeIds.includes(id))

      // 削除処理
      for (const fc of toDelete) {
        await deleteFieldCrop(fc.id)
      }

      // 追加処理
      for (const cropTypeId of toAdd) {
        await createFieldCrop({
          field_id: field.id,
          crop_type_id: cropTypeId,
          fiscal_year: null,
          area_hectares: null,
          notes: null,
        })
      }

      setIsCropDialogOpen(false)
    } catch (error) {
      console.error('Failed to save crops:', error)
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

  // 細部工程ハンドラー
  const handleToggleExpand = async (workAreaId: string) => {
    if (expandedWorkAreaId === workAreaId) {
      setExpandedWorkAreaId(null)
    } else {
      setExpandedWorkAreaId(workAreaId)
      await fetchSubProcesses(workAreaId)
    }
  }

  const handleOpenSubProcessDialog = (workAreaId: string, subProcess?: WorkAreaSubProcess) => {
    const currentSubProcesses = subProcesses.filter(sp => sp.field_work_area_id === workAreaId)
    if (subProcess) {
      setEditingSubProcess(subProcess)
      setSubProcessForm({
        field_work_area_id: subProcess.field_work_area_id,
        name: subProcess.name,
        display_order: subProcess.display_order,
        planned_start: subProcess.planned_start || '',
        planned_end: subProcess.planned_end || '',
        actual_start: subProcess.actual_start || '',
        actual_end: subProcess.actual_end || '',
        notes: subProcess.notes || '',
      })
    } else {
      setEditingSubProcess(null)
      setSubProcessForm({
        field_work_area_id: workAreaId,
        name: '',
        display_order: currentSubProcesses.length,
        planned_start: '',
        planned_end: '',
        actual_start: '',
        actual_end: '',
        notes: '',
      })
    }
    setIsSubProcessDialogOpen(true)
  }

  const handleSaveSubProcess = async () => {
    try {
      if (editingSubProcess) {
        await updateSubProcess(editingSubProcess.id, {
          name: subProcessForm.name,
          display_order: subProcessForm.display_order,
          planned_start: subProcessForm.planned_start || null,
          planned_end: subProcessForm.planned_end || null,
          actual_start: subProcessForm.actual_start || null,
          actual_end: subProcessForm.actual_end || null,
          notes: subProcessForm.notes || null,
        })
      } else {
        await createSubProcess({
          field_work_area_id: subProcessForm.field_work_area_id,
          name: subProcessForm.name,
          display_order: subProcessForm.display_order,
          planned_start: subProcessForm.planned_start || null,
          planned_end: subProcessForm.planned_end || null,
          actual_start: subProcessForm.actual_start || null,
          actual_end: subProcessForm.actual_end || null,
          notes: subProcessForm.notes || null,
        })
      }
      setIsSubProcessDialogOpen(false)
    } catch (error) {
      console.error('Failed to save sub process:', error)
    }
  }

  const handleDeleteSubProcess = async (id: string) => {
    try {
      await deleteSubProcess(id)
    } catch (error) {
      console.error('Failed to delete sub process:', error)
    }
  }

  // 既に登録されている工種を除いた工種リスト
  const availableWorkTypes = workTypes.filter(
    wt => !fieldWorkAreas.some(fwa => fwa.work_type_id === wt.id)
  )

  // 現在展開中の工種の細部工程を取得
  const currentSubProcesses = expandedWorkAreaId
    ? subProcesses.filter(sp => sp.field_work_area_id === expandedWorkAreaId)
    : []

  if (!field) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

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
                圃場 {field.field_number}
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
          {/* 工種 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  工種
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
            </CardHeader>
            <CardContent>
              {fieldWorkAreas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  工種が登録されていません
                </p>
              ) : (
                <div className="space-y-3">
                  {fieldWorkAreas.map((fwa) => {
                    const isExpanded = expandedWorkAreaId === fwa.id
                    const fwaSubProcesses = isExpanded ? currentSubProcesses : []

                    return (
                      <div
                        key={fwa.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleExpand(fwa.id)}
                                className="p-0.5 hover:bg-gray-100 rounded"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                              </button>
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
                          <div className="grid grid-cols-2 gap-2 text-xs ml-6">
                            <div>
                              <span className="text-muted-foreground">予定: </span>
                              {fwa.planned_start && fwa.planned_end ? (
                                <span>{fwa.planned_start} 〜 {fwa.planned_end}</span>
                              ) : (
                                <span className="text-muted-foreground">未設定</span>
                              )}
                            </div>
                            <div>
                              <span className="text-muted-foreground">実績: </span>
                              {fwa.actual_start ? (
                                <span>
                                  {fwa.actual_start}
                                  {fwa.actual_end ? ` 〜 ${fwa.actual_end}` : ' 〜'}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">未着手</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 細部工程リスト */}
                        {isExpanded && (
                          <div className="border-t bg-gray-50 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-600">細部工程</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs"
                                onClick={() => handleOpenSubProcessDialog(fwa.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                追加
                              </Button>
                            </div>
                            {fwaSubProcesses.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                細部工程がありません
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {fwaSubProcesses.map((sp) => (
                                  <div
                                    key={sp.id}
                                    className="bg-white border rounded p-2 space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">{sp.name}</span>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0"
                                          onClick={() => handleOpenSubProcessDialog(fwa.id, sp)}
                                        >
                                          <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                          onClick={() => handleDeleteSubProcess(sp.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>
                                        <span className="text-muted-foreground">予定: </span>
                                        {sp.planned_start && sp.planned_end ? (
                                          <span>{sp.planned_start} 〜 {sp.planned_end}</span>
                                        ) : (
                                          <span className="text-muted-foreground">未設定</span>
                                        )}
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">実績: </span>
                                        {sp.actual_start ? (
                                          <span>
                                            {sp.actual_start}
                                            {sp.actual_end ? ` 〜 ${sp.actual_end}` : ' 〜'}
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">未着手</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
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
                  <Pencil className="h-3 w-3 mr-1" />
                  編集
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {fieldCrops.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  作付けが登録されていません
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {fieldCrops.map((fc) => (
                    <Badge
                      key={fc.id}
                      variant="secondary"
                      className="text-sm py-1 px-3"
                    >
                      <Wheat className="h-3 w-3 mr-1 text-amber-600" />
                      {fc.crop_type.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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

      {/* 工種ダイアログ */}
      <Dialog open={isWorkAreaDialogOpen} onOpenChange={setIsWorkAreaDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingWorkArea ? '工種を編集' : '工種を追加'}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planned_start">着工予定日</Label>
                <Input
                  id="planned_start"
                  type="date"
                  value={workAreaForm.planned_start}
                  onChange={(e) =>
                    setWorkAreaForm({ ...workAreaForm, planned_start: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planned_end">完了予定日</Label>
                <Input
                  id="planned_end"
                  type="date"
                  value={workAreaForm.planned_end}
                  onChange={(e) =>
                    setWorkAreaForm({ ...workAreaForm, planned_end: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="actual_start">着工日（実績）</Label>
                <Input
                  id="actual_start"
                  type="date"
                  value={workAreaForm.actual_start}
                  onChange={(e) =>
                    setWorkAreaForm({ ...workAreaForm, actual_start: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual_end">完了日（実績）</Label>
                <Input
                  id="actual_end"
                  type="date"
                  value={workAreaForm.actual_end}
                  onChange={(e) =>
                    setWorkAreaForm({ ...workAreaForm, actual_end: e.target.value })
                  }
                />
              </div>
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
            <DialogTitle>作付けを選択</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>作付け種類（複数選択可）</Label>
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
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {cropTypes.map((ct) => (
                <label
                  key={ct.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedCropTypeIds.includes(ct.id)}
                    onCheckedChange={() => handleToggleCropType(ct.id)}
                  />
                  <span className="text-sm">{ct.name}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleSaveCrops}>
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

      {/* 細部工程ダイアログ */}
      <Dialog open={isSubProcessDialogOpen} onOpenChange={setIsSubProcessDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSubProcess ? '細部工程を編集' : '細部工程を追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sub_process_name">工程名</Label>
              <Input
                id="sub_process_name"
                value={subProcessForm.name}
                onChange={(e) =>
                  setSubProcessForm({ ...subProcessForm, name: e.target.value })
                }
                placeholder="例: 掘削"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sp_planned_start">着工予定日</Label>
                <Input
                  id="sp_planned_start"
                  type="date"
                  value={subProcessForm.planned_start}
                  onChange={(e) =>
                    setSubProcessForm({ ...subProcessForm, planned_start: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp_planned_end">完了予定日</Label>
                <Input
                  id="sp_planned_end"
                  type="date"
                  value={subProcessForm.planned_end}
                  onChange={(e) =>
                    setSubProcessForm({ ...subProcessForm, planned_end: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sp_actual_start">着工日（実績）</Label>
                <Input
                  id="sp_actual_start"
                  type="date"
                  value={subProcessForm.actual_start}
                  onChange={(e) =>
                    setSubProcessForm({ ...subProcessForm, actual_start: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sp_actual_end">完了日（実績）</Label>
                <Input
                  id="sp_actual_end"
                  type="date"
                  value={subProcessForm.actual_end}
                  onChange={(e) =>
                    setSubProcessForm({ ...subProcessForm, actual_end: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp_notes">備考</Label>
              <Textarea
                id="sp_notes"
                value={subProcessForm.notes}
                onChange={(e) => setSubProcessForm({ ...subProcessForm, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubProcessDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSaveSubProcess}
              disabled={!subProcessForm.name.trim()}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

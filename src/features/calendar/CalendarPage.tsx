import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, Download, Building2 } from 'lucide-react'
import { GanttCalendar } from '@/components/calendar/GanttCalendar'
import { useProjectStore, useSelectedProjectStore } from '@/stores/projectStore'

export function CalendarPage() {
  const {
    projects,
    projectFields,
    workTypes,
    fetchProjects,
    fetchProjectFields,
    fetchWorkTypes,
    isLoading
  } = useProjectStore()
  const { selectedProjectId, _hasHydrated } = useSelectedProjectStore()

  const [selectedWorkType, setSelectedWorkType] = useState<string>('all')

  useEffect(() => {
    fetchProjects()
    fetchWorkTypes()
  }, [fetchProjects, fetchWorkTypes])

  useEffect(() => {
    if (_hasHydrated && selectedProjectId) {
      fetchProjectFields(selectedProjectId)
    }
  }, [_hasHydrated, selectedProjectId, fetchProjectFields])

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  const handleAssignmentClick = (assignmentId: string) => {
    console.log('Assignment clicked:', assignmentId)
    // TODO: 詳細モーダルを表示
  }

  // 工種でフィルタリング
  const filteredFields = selectedWorkType === 'all'
    ? projectFields
    : projectFields.map(pf => ({
        ...pf,
        assignments: pf.assignments.filter(a => a.work_type_id === selectedWorkType)
      })).filter(pf => pf.assignments.length > 0)

  // 工事が選択されていない場合
  if (!selectedProjectId || !selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">カレンダー</h1>
          <p className="text-muted-foreground">工事の工程をガントチャートで確認できます</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">工事を選択してください</p>
          <p className="text-sm text-muted-foreground mt-2">
            ヘッダーから工事を選択すると、その工事の工程表が表示されます
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">カレンダー</h1>
          <p className="text-muted-foreground">
            {selectedProject.fiscal_year && `${selectedProject.fiscal_year}年度 `}
            {selectedProject.name} の工程表
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          エクスポート
        </Button>
      </div>

      {/* フィルター */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-48">
              <label className="text-sm font-medium mb-1 block">工種</label>
              <Select value={selectedWorkType} onValueChange={setSelectedWorkType}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="工種" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての工種</SelectItem>
                  {workTypes.map((wt) => (
                    <SelectItem key={wt.id} value={wt.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: wt.color || '#6B7280' }}
                        />
                        {wt.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ガントチャート */}
      {selectedProjectId ? (
        <GanttCalendar
          projectFields={filteredFields}
          workTypes={workTypes}
          onAssignmentClick={handleAssignmentClick}
        />
      ) : null}

      {/* サマリー */}
      {selectedProjectId && filteredFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">圃場数</p>
              <p className="text-2xl font-bold">{filteredFields.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">作業数</p>
              <p className="text-2xl font-bold">
                {filteredFields.reduce((sum, pf) => sum + pf.assignments.length, 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">完了</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredFields.reduce((sum, pf) =>
                  sum + pf.assignments.filter(a => a.status === 'completed').length, 0
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">進行中</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredFields.reduce((sum, pf) =>
                  sum + pf.assignments.filter(a => a.status === 'in_progress').length, 0
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

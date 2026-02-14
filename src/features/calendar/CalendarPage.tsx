import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, Download } from 'lucide-react'
import { GanttCalendar } from '@/components/calendar/GanttCalendar'
import { useProjectStore } from '@/stores/projectStore'

export function CalendarPage() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project')

  const {
    projects,
    projectFields,
    workTypes,
    fetchProjects,
    fetchProjectFields,
    fetchWorkTypes,
    isLoading
  } = useProjectStore()

  const [selectedProject, setSelectedProject] = useState<string>(projectId || '')
  const [selectedWorkType, setSelectedWorkType] = useState<string>('all')

  useEffect(() => {
    fetchProjects()
    fetchWorkTypes()
  }, [fetchProjects, fetchWorkTypes])

  useEffect(() => {
    if (selectedProject) {
      fetchProjectFields(selectedProject)
    }
  }, [selectedProject, fetchProjectFields])

  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId)
    } else if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projectId, projects, selectedProject])

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
          <p className="text-muted-foreground">工事の工程をガントチャートで確認できます</p>
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
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">工事</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
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
            </div>
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
      {selectedProject ? (
        <GanttCalendar
          projectFields={filteredFields}
          workTypes={workTypes}
          onAssignmentClick={handleAssignmentClick}
        />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">工事を選択してください</p>
          </CardContent>
        </Card>
      )}

      {/* サマリー */}
      {selectedProject && filteredFields.length > 0 && (
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

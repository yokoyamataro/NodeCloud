import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Map, Calendar, MessageSquare, Edit, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjectStore } from '@/stores/projectStore'
import { getStatusLabel, getStatusColor, formatFieldLabel } from '@/lib/utils'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject, projectFields, fetchProject, fetchProjectFields, fetchWorkTypes, workTypes, isLoading } = useProjectStore()

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId)
      fetchProjectFields(projectId)
      fetchWorkTypes()
    }
  }, [projectId, fetchProject, fetchProjectFields, fetchWorkTypes])

  if (isLoading || !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 圃場を農家番号でグループ化
  const fieldsByFarmer = projectFields.reduce((acc, pf) => {
    const farmerNumber = pf.field.farmer.farmer_number
    if (!acc[farmerNumber]) {
      acc[farmerNumber] = {
        farmer: pf.field.farmer,
        fields: [],
      }
    }
    acc[farmerNumber].fields.push(pf)
    return acc
  }, {} as Record<number, { farmer: typeof projectFields[0]['field']['farmer']; fields: typeof projectFields }>)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{currentProject.name}</h1>
              <Badge className={getStatusColor(currentProject.status)}>
                {getStatusLabel(currentProject.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{currentProject.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            編集
          </Button>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Link to={`/map?project=${projectId}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Map className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium">地図で見る</span>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/calendar?project=${projectId}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium">カレンダー</span>
            </CardContent>
          </Card>
        </Link>
        <Link to={`/chat?project=${projectId}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <MessageSquare className="h-5 w-5 text-orange-600" />
              </div>
              <span className="font-medium">チャット</span>
            </CardContent>
          </Card>
        </Link>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <span className="font-medium">関係者</span>
          </CardContent>
        </Card>
      </div>

      {/* 工事情報と圃場 */}
      <Tabs defaultValue="fields" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fields">圃場一覧</TabsTrigger>
          <TabsTrigger value="overview">概要</TabsTrigger>
          <TabsTrigger value="companies">業者</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          {Object.keys(fieldsByFarmer).length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">圃場がありません</p>
                <Button className="mt-4">圃場を追加</Button>
              </CardContent>
            </Card>
          ) : (
            Object.entries(fieldsByFarmer).map(([farmerNumber, { farmer, fields }]) => (
              <Card key={farmerNumber}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {farmerNumber}番 - {farmer.name}
                  </CardTitle>
                  <CardDescription>
                    {fields.length}件の圃場
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fields.map((pf) => (
                      <div key={pf.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">
                              {formatFieldLabel(farmer.farmer_number, pf.field.field_number)}
                            </span>
                            <Badge className={getStatusColor(pf.status)} variant="outline">
                              {getStatusLabel(pf.status)}
                            </Badge>
                            {pf.field.area_hectares && (
                              <span className="text-sm text-muted-foreground">
                                {pf.field.area_hectares}ha
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 工種別進捗 */}
                        <div className="space-y-2">
                          {pf.assignments.map((assignment) => (
                            <div key={assignment.id} className="flex items-center gap-3">
                              <div
                                className="w-16 text-sm font-medium px-2 py-0.5 rounded text-white text-center"
                                style={{ backgroundColor: assignment.work_type.color || '#6B7280' }}
                              >
                                {assignment.work_type.name}
                              </div>
                              <div className="flex-1">
                                <Progress value={assignment.progress_pct} className="h-2" />
                              </div>
                              <span className="text-sm w-12 text-right">
                                {assignment.progress_pct}%
                              </span>
                              <Badge className={getStatusColor(assignment.status)} variant="outline">
                                {getStatusLabel(assignment.status)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>工事概要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">工期</p>
                  <p className="font-medium">
                    {currentProject.start_date || '未定'} 〜 {currentProject.end_date || '未定'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ステータス</p>
                  <Badge className={getStatusColor(currentProject.status)}>
                    {getStatusLabel(currentProject.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">圃場数</p>
                  <p className="font-medium">{projectFields.length}件</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">総面積</p>
                  <p className="font-medium">
                    {projectFields.reduce((sum, pf) => sum + (pf.field.area_hectares || 0), 0).toFixed(2)}ha
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">工種</p>
                <div className="flex flex-wrap gap-2">
                  {workTypes.map((wt) => (
                    <div
                      key={wt.id}
                      className="px-3 py-1 rounded-full text-sm text-white"
                      style={{ backgroundColor: wt.color || '#6B7280' }}
                    >
                      {wt.name}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>参加業者</CardTitle>
              <CardDescription>この工事に参加している業者一覧</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">北海道建設株式会社</p>
                      <p className="text-sm text-muted-foreground">元請</p>
                    </div>
                    <Badge>元請</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">空知測量事務所</p>
                      <p className="text-sm text-muted-foreground">測量</p>
                    </div>
                    <Badge variant="outline">下請（測量）</Badge>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">大地掘削工業</p>
                      <p className="text-sm text-muted-foreground">掘削</p>
                    </div>
                    <Badge variant="outline">下請（掘削）</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

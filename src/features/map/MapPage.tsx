import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Layers, Maximize2, Building2 } from 'lucide-react'
import { MapView } from '@/components/map/MapView'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { useProjectStore, useSelectedProjectStore } from '@/stores/projectStore'
import { useFieldStore } from '@/stores/fieldStore'

export function MapPage() {
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const { projects, fetchProjects } = useProjectStore()
  const { selectedProjectId, _hasHydrated } = useSelectedProjectStore()
  const { fields, fetchFields } = useFieldStore()

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (_hasHydrated && selectedProjectId) {
      fetchFields(selectedProjectId)
    }
  }, [_hasHydrated, selectedProjectId, fetchFields])

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const fieldsWithPolygon = fields.filter(f => f.area_polygon).length

  const handleFieldClick = (fieldId: string) => {
    setSelectedField(fieldId)
  }

  // 工事が選択されていない場合
  if (!selectedProjectId || !selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">地図</h1>
          <p className="text-muted-foreground">圃場の位置と進捗状況を地図上で確認できます</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">工事を選択してください</p>
          <p className="text-sm text-muted-foreground mt-2">
            ヘッダーから工事を選択すると、その工事の圃場が地図に表示されます
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">地図</h1>
          <p className="text-muted-foreground">
            {selectedProject.fiscal_year && `${selectedProject.fiscal_year}年度 `}
            {selectedProject.name} の圃場を表示しています
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Layers className="h-4 w-4 mr-2" />
            レイヤー
          </Button>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 地図 */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              <MapView
                key={selectedProjectId}
                className="h-[600px] rounded-lg"
                projectId={selectedProjectId}
                onFieldClick={handleFieldClick}
              />
            </CardContent>
          </Card>
        </div>

        {/* サイドパネル */}
        <div className="space-y-4">
          {/* 選択した圃場の情報 */}
          {selectedField && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">圃場情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">圃場番号</p>
                  <p className="font-medium">1-1</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">農家名</p>
                  <p className="font-medium">山田農場</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">面積</p>
                  <p className="font-medium">2.5 ha</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ステータス</p>
                  <Badge className={getStatusColor('in_progress')}>
                    {getStatusLabel('in_progress')}
                  </Badge>
                </div>
                <Button className="w-full" variant="outline">
                  詳細を見る
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 工事情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">工事情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-2 rounded bg-primary/10 border border-primary">
                  <p className="font-medium text-sm">
                    {selectedProject.fiscal_year && `${selectedProject.fiscal_year}年度 `}
                    {selectedProject.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ポリゴン設定済: {fieldsWithPolygon}件 / 全圃場: {fields.length}件
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 凡例 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">凡例</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">進捗状況</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span>未着手</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span>進行中</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span>完了</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  JAPAN_PLANE_ORIGINS,
  HOKKAIDO_ZONES,
  parseCoordinateLines,
  polygonToPlaneString,
} from '@/lib/coordinate'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, ArrowRightLeft } from 'lucide-react'

interface CoordinateInputProps {
  currentPolygon?: GeoJSON.Polygon | null
  onApply: (polygon: GeoJSON.Polygon) => void
  className?: string
}

export function CoordinateInput({
  currentPolygon,
  onApply,
  className = '',
}: CoordinateInputProps) {
  const [zone, setZone] = useState<number>(12) // 北海道（札幌周辺）
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [parsedPoints, setParsedPoints] = useState<Array<{ lat: number; lng: number }>>([])

  // 座標をパースしてプレビュー
  const handleParseInput = () => {
    setError(null)
    setParsedPoints([])

    if (!inputText.trim()) {
      setError('座標を入力してください')
      return
    }

    try {
      const points = parseCoordinateLines(inputText, zone)

      if (points.length < 3) {
        setError('ポリゴンを形成するには3点以上の座標が必要です')
        return
      }

      setParsedPoints(points)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // パースした座標をポリゴンとして適用
  const handleApplyPolygon = () => {
    if (parsedPoints.length < 3) {
      setError('ポリゴンを形成するには3点以上の座標が必要です')
      return
    }

    const coordinates: Array<[number, number]> = parsedPoints.map(({ lat, lng }) => [lng, lat])
    // ポリゴンを閉じる
    if (
      coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
      coordinates[0][1] !== coordinates[coordinates.length - 1][1]
    ) {
      coordinates.push([...coordinates[0]])
    }

    const polygon: GeoJSON.Polygon = {
      type: 'Polygon',
      coordinates: [coordinates],
    }

    onApply(polygon)
    setInputText('')
    setParsedPoints([])
  }

  // 現在のポリゴンを平面直角座標に変換
  const handleConvertToPlane = () => {
    setOutputText('')
    setError(null)

    if (!currentPolygon || !currentPolygon.coordinates[0]) {
      setError('ポリゴンが設定されていません')
      return
    }

    try {
      const coords = currentPolygon.coordinates[0] as Array<[number, number]>
      const planeText = polygonToPlaneString(coords, zone)
      setOutputText(planeText)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          平面直角座標
        </CardTitle>
        <CardDescription>
          日本測地系の平面直角座標を入力してポリゴンを設定できます
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 座標系選択 */}
        <div className="space-y-2">
          <Label>座標系</Label>
          <Select value={zone.toString()} onValueChange={(v) => setZone(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOKKAIDO_ZONES.map((z) => (
                <SelectItem key={z} value={z.toString()}>
                  {JAPAN_PLANE_ORIGINS[z].name}
                </SelectItem>
              ))}
              <SelectItem value="divider" disabled>
                ─ その他の地域 ─
              </SelectItem>
              {Object.entries(JAPAN_PLANE_ORIGINS)
                .filter(([k]) => !HOKKAIDO_ZONES.includes(Number(k) as 11 | 12 | 13))
                .map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="input">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input">座標入力</TabsTrigger>
            <TabsTrigger value="export">座標出力</TabsTrigger>
          </TabsList>

          {/* 座標入力タブ */}
          <TabsContent value="input" className="space-y-4">
            <div className="space-y-2">
              <Label>
                座標入力（X, Y形式、1行1点）
              </Label>
              <Textarea
                placeholder={`例:\n-12345.678, 23456.789\n-12340.000, 23460.000\n-12350.000, 23450.000`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                X（南北方向）, Y（東西方向）の順で入力。カンマまたはスペース区切り。
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleParseInput} className="flex-1">
                プレビュー
              </Button>
              <Button
                onClick={handleApplyPolygon}
                disabled={parsedPoints.length < 3}
                className="flex-1"
              >
                ポリゴンに適用
              </Button>
            </div>

            {/* プレビュー */}
            {parsedPoints.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {parsedPoints.length}点の座標を認識
                </div>
                <div className="text-xs text-green-600 space-y-1 max-h-32 overflow-y-auto">
                  {parsedPoints.map((p, i) => (
                    <div key={i}>
                      点{i + 1}: 緯度 {p.lat.toFixed(6)}°, 経度 {p.lng.toFixed(6)}°
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 座標出力タブ */}
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  現在のポリゴン座標
                </Label>
                <Button variant="outline" size="sm" onClick={handleConvertToPlane}>
                  変換
                </Button>
              </div>
              <Textarea
                placeholder="ポリゴンを設定後、「変換」ボタンをクリックしてください"
                value={outputText}
                readOnly
                rows={6}
                className="font-mono text-sm"
              />
              {outputText && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(outputText)}
                  className="w-full"
                >
                  クリップボードにコピー
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

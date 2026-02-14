import { useEffect, useRef, useState, useCallback } from 'react'
import { mapboxgl, HOKKAIDO_CENTER, DEFAULT_ZOOM } from '@/lib/mapbox'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { Button } from '@/components/ui/button'
import { Trash2, Map as MapIcon, Pencil, Save, RotateCcw } from 'lucide-react'

interface PolygonEditorProps {
  initialPolygon?: GeoJSON.Polygon | null
  onSave: (polygon: GeoJSON.Polygon | null) => void
  onCancel?: () => void
  className?: string
  readOnly?: boolean
}

export function PolygonEditor({
  initialPolygon,
  onSave,
  onCancel,
  className = '',
  readOnly = false,
}: PolygonEditorProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const draw = useRef<MapboxDraw | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [currentPolygon, setCurrentPolygon] = useState<GeoJSON.Polygon | null>(
    initialPolygon || null
  )
  const [isDrawing, setIsDrawing] = useState(false)
  const [noToken, setNoToken] = useState(false)
  const initialPolygonRef = useRef(initialPolygon)

  // 初期ポリゴンからMapboxの中心を計算
  const getInitialCenter = useCallback((): [number, number] => {
    if (initialPolygon && initialPolygon.coordinates[0]) {
      const coords = initialPolygon.coordinates[0]
      const lngSum = coords.reduce((sum, c) => sum + (c[0] || 0), 0)
      const latSum = coords.reduce((sum, c) => sum + (c[1] || 0), 0)
      return [lngSum / coords.length, latSum / coords.length]
    }
    return HOKKAIDO_CENTER
  }, [initialPolygon])

  // ポリゴンをDrawに追加する関数
  const addPolygonToDraw = useCallback((polygon: GeoJSON.Polygon) => {
    if (!draw.current || !map.current) return

    try {
      // 既存のポリゴンを削除
      draw.current.deleteAll()

      // FeatureCollectionとして追加
      const featureCollection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: polygon,
        }]
      }
      draw.current.set(featureCollection)

      // ポリゴンにフィット
      const bounds = new mapboxgl.LngLatBounds()
      polygon.coordinates[0].forEach((coord) => {
        bounds.extend(coord as [number, number])
      })
      map.current.fitBounds(bounds, { padding: 50 })
    } catch (error) {
      console.error('Failed to add polygon to draw:', error)
    }
  }, [])

  useEffect(() => {
    if (!mapContainer.current) return

    if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
      setNoToken(true)
      return
    }

    const initialCenter = getInitialCenter()

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: initialCenter,
      zoom: initialPolygon ? 14 : DEFAULT_ZOOM,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left')

    map.current.on('load', () => {
      // Drawコントロールを地図ロード後に追加
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: readOnly ? {} : {
          polygon: true,
          trash: true,
        },
        defaultMode: 'simple_select',
      })

      if (!readOnly) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        map.current!.addControl(draw.current as any, 'top-left')

        // 描画イベントのリスナー
        map.current!.on('draw.create', () => {
          updatePolygonFromDraw()
        })
        map.current!.on('draw.update', () => {
          updatePolygonFromDraw()
        })
        map.current!.on('draw.delete', () => {
          setCurrentPolygon(null)
          setHasChanges(true)
        })
        map.current!.on('draw.modechange', (e: { mode: string }) => {
          setIsDrawing(e.mode === 'draw_polygon')
        })
      }

      // 少し遅延させて初期ポリゴンを追加
      setTimeout(() => {
        if (initialPolygonRef.current && draw.current) {
          addPolygonToDraw(initialPolygonRef.current)
        }
        setMapLoaded(true)
      }, 100)
    })

    return () => {
      map.current?.remove()
    }
  }, [readOnly, getInitialCenter, addPolygonToDraw])

  // initialPolygonが変更された場合の処理
  useEffect(() => {
    initialPolygonRef.current = initialPolygon
    if (mapLoaded && initialPolygon && draw.current) {
      addPolygonToDraw(initialPolygon)
      setCurrentPolygon(initialPolygon)
    }
  }, [initialPolygon, mapLoaded, addPolygonToDraw])

  const updatePolygonFromDraw = useCallback(() => {
    if (!draw.current) return

    const data = draw.current.getAll()
    if (data.features.length > 0) {
      const feature = data.features[0]
      if (feature.geometry.type === 'Polygon') {
        setCurrentPolygon(feature.geometry as GeoJSON.Polygon)
        setHasChanges(true)
      }
    }
  }, [])

  const handleClear = () => {
    if (draw.current) {
      draw.current.deleteAll()
      setCurrentPolygon(null)
      setHasChanges(true)
    }
  }

  const handleReset = () => {
    if (draw.current) {
      draw.current.deleteAll()
      if (initialPolygonRef.current) {
        addPolygonToDraw(initialPolygonRef.current)
        setCurrentPolygon(initialPolygonRef.current)
      } else {
        setCurrentPolygon(null)
      }
      setHasChanges(false)
    }
  }

  const handleSave = () => {
    onSave(currentPolygon)
  }

  const startDrawing = () => {
    if (draw.current) {
      draw.current.changeMode('draw_polygon')
      setIsDrawing(true)
    }
  }

  if (noToken) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
        style={{ minHeight: '400px' }}
      >
        <div className="text-center p-8">
          <MapIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            地図を表示するにはMapboxトークンが必要です
          </h3>
          <p className="text-sm text-muted-foreground">
            .envファイルにVITE_MAPBOX_ACCESS_TOKENを設定してください
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* コントロールパネル */}
      {!readOnly && mapLoaded && (
        <div className="absolute top-4 right-16 flex flex-col gap-2">
          <Button
            size="sm"
            variant={isDrawing ? 'default' : 'secondary'}
            onClick={startDrawing}
            className="shadow-lg"
          >
            <Pencil className="h-4 w-4 mr-1" />
            描画
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleClear}
            disabled={!currentPolygon}
            className="shadow-lg"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            クリア
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleReset}
            disabled={!hasChanges}
            className="shadow-lg"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            リセット
          </Button>
        </div>
      )}

      {/* 保存・キャンセルボタン */}
      {!readOnly && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel} className="shadow-lg">
              キャンセル
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges} className="shadow-lg">
            <Save className="h-4 w-4 mr-1" />
            保存
          </Button>
        </div>
      )}

      {/* ステータス表示 */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg p-2 shadow-lg text-xs">
        {currentPolygon ? (
          <span className="text-green-600">ポリゴン設定済み</span>
        ) : (
          <span className="text-muted-foreground">ポリゴン未設定</span>
        )}
        {hasChanges && <span className="text-orange-500 ml-2">※ 未保存の変更あり</span>}
      </div>

      {/* 描画中の説明 */}
      {isDrawing && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          クリックして頂点を追加。ダブルクリックで確定。
        </div>
      )}
    </div>
  )
}

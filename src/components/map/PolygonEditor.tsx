import { useEffect, useRef, useState, useCallback } from 'react'
import { mapboxgl, HOKKAIDO_CENTER, DEFAULT_ZOOM, getFieldPolygonColor } from '@/lib/mapbox'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { Button } from '@/components/ui/button'
import { Trash2, Map as MapIcon, Pencil, Save, RotateCcw } from 'lucide-react'
import type { FieldWithFarmer } from '@/types/database'

interface PolygonEditorProps {
  initialPolygon?: GeoJSON.Polygon | null
  onSave: (polygon: GeoJSON.Polygon | null) => void
  onCancel?: () => void
  className?: string
  readOnly?: boolean
  /** 他の圃場ポリゴンを表示するための圃場リスト */
  otherFields?: FieldWithFarmer[]
  /** 現在編集中の圃場ID（他の圃場表示から除外するため） */
  currentFieldId?: string
}

export function PolygonEditor({
  initialPolygon,
  onSave,
  onCancel,
  className = '',
  readOnly = false,
  otherFields = [],
  currentFieldId,
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

  // 現在のポリゴンをrefで保持（useCallback内で最新の値を参照するため）
  const currentPolygonRef = useRef(currentPolygon)
  const initialPolygonRef = useRef(initialPolygon)
  const readOnlyRef = useRef(readOnly)

  // refを最新の状態に更新
  useEffect(() => {
    currentPolygonRef.current = currentPolygon
  }, [currentPolygon])

  useEffect(() => {
    initialPolygonRef.current = initialPolygon
  }, [initialPolygon])

  useEffect(() => {
    readOnlyRef.current = readOnly
  }, [readOnly])

  // 初期ポリゴンからMapboxの中心を計算
  const getInitialCenter = useCallback((): [number, number] => {
    const polygon = initialPolygonRef.current
    if (polygon && polygon.coordinates[0]) {
      const coords = polygon.coordinates[0]
      const lngSum = coords.reduce((sum, c) => sum + (c[0] || 0), 0)
      const latSum = coords.reduce((sum, c) => sum + (c[1] || 0), 0)
      return [lngSum / coords.length, latSum / coords.length]
    }
    return HOKKAIDO_CENTER
  }, [])

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

  // Drawからポリゴンを取得して状態を更新
  const updatePolygonFromDraw = useCallback(() => {
    if (!draw.current) return

    const data = draw.current.getAll()
    if (data.features.length > 0) {
      const feature = data.features[0]
      if (feature.geometry.type === 'Polygon') {
        const newPolygon = feature.geometry as GeoJSON.Polygon
        setCurrentPolygon(newPolygon)
        currentPolygonRef.current = newPolygon
        setHasChanges(true)
      }
    }
  }, [])

  // マップの初期化（一度だけ実行）
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
      zoom: initialPolygonRef.current ? 14 : DEFAULT_ZOOM,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left')

    map.current.on('load', () => {
      // Drawコントロールを作成（常に追加、readOnlyの時はコントロールを非表示）
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: readOnlyRef.current ? {} : {
          polygon: true,
          trash: true,
        },
        defaultMode: 'simple_select',
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.current!.addControl(draw.current as any, 'top-left')

      // イベントリスナーを追加
      map.current!.on('draw.create', () => {
        if (!readOnlyRef.current) {
          updatePolygonFromDraw()
        }
      })
      map.current!.on('draw.update', () => {
        if (!readOnlyRef.current) {
          updatePolygonFromDraw()
        }
      })
      map.current!.on('draw.delete', () => {
        if (!readOnlyRef.current) {
          setCurrentPolygon(null)
          currentPolygonRef.current = null
          setHasChanges(true)
        }
      })
      map.current!.on('draw.modechange', (e: { mode: string }) => {
        setIsDrawing(e.mode === 'draw_polygon')
      })

      // 初期ポリゴンを描画
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 初期化は一度だけ

  // 他の圃場ポリゴンを表示
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // 現在編集中の圃場以外でポリゴンがある圃場をフィルタリング
    const fieldsToShow = otherFields.filter(
      (f) => f.id !== currentFieldId && f.area_polygon
    )

    // 既存のレイヤーとソースを削除
    otherFields.forEach((field) => {
      const sourceId = `other-field-${field.id}`
      const labelSourceId = `${sourceId}-label`
      const layerId = `other-field-fill-${field.id}`
      const outlineId = `other-field-outline-${field.id}`
      const labelId = `other-field-label-${field.id}`

      try {
        if (map.current!.getLayer(labelId)) {
          map.current!.removeLayer(labelId)
        }
        if (map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId)
        }
        if (map.current!.getLayer(outlineId)) {
          map.current!.removeLayer(outlineId)
        }
        if (map.current!.getSource(labelSourceId)) {
          map.current!.removeSource(labelSourceId)
        }
        if (map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId)
        }
      } catch (e) {
        // 無視
      }
    })

    // 他の圃場ポリゴンを追加
    fieldsToShow.forEach((field) => {
      if (!field.area_polygon) return

      const polygon = field.area_polygon as { type: string; coordinates: number[][][] }
      if (!polygon.coordinates || polygon.coordinates.length === 0) return

      const label = `${field.farmer.farmer_number}-${field.field_number}`
      const sourceId = `other-field-${field.id}`
      const layerId = `other-field-fill-${field.id}`
      const outlineId = `other-field-outline-${field.id}`
      const labelId = `other-field-label-${field.id}`

      // ポリゴンの中心を計算
      const center = polygon.coordinates[0].reduce(
        (acc, coord) => [
          acc[0] + coord[0] / polygon.coordinates[0].length,
          acc[1] + coord[1] / polygon.coordinates[0].length,
        ],
        [0, 0]
      )

      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            id: field.id,
            label: label,
            farmerName: field.farmer.name,
          },
          geometry: {
            type: 'Polygon',
            coordinates: polygon.coordinates,
          },
        },
      })

      // 塗りつぶし（他の圃場は薄いグレー）
      map.current!.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': getFieldPolygonColor(50),
          'fill-opacity': 0.3,
        },
      })

      // アウトライン
      map.current!.addLayer({
        id: outlineId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#6B7280',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
        },
      })

      // ラベル用のポイントソース
      map.current!.addSource(`${sourceId}-label`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: { label },
          geometry: {
            type: 'Point',
            coordinates: center,
          },
        },
      })

      // ラベル
      map.current!.addLayer({
        id: labelId,
        type: 'symbol',
        source: `${sourceId}-label`,
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 12,
          'text-anchor': 'center',
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#374151',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
        },
      })
    })

    // 全ての圃場にフィットするようにズーム（初期ポリゴンがない場合のみ）
    if (!initialPolygonRef.current && fieldsToShow.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      fieldsToShow.forEach((field) => {
        const polygon = field.area_polygon as { type: string; coordinates: number[][][] }
        if (polygon.coordinates && polygon.coordinates[0]) {
          polygon.coordinates[0].forEach((coord) => {
            bounds.extend(coord as [number, number])
          })
        }
      })
      map.current!.fitBounds(bounds, { padding: 50 })
    }
  }, [otherFields, currentFieldId, mapLoaded])

  // readOnlyの変更を監視してDrawコントロールを再設定
  useEffect(() => {
    if (!mapLoaded || !map.current || !draw.current) return

    // 既存のDrawコントロールを削除
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.current.removeControl(draw.current as any)
    } catch {
      // 無視
    }

    // 新しいDrawコントロールを作成
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: readOnly ? {} : {
        polygon: true,
        trash: true,
      },
      defaultMode: 'simple_select',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.current.addControl(draw.current as any, 'top-left')

    // 現在のポリゴンを再描画
    setTimeout(() => {
      const polygonToShow = currentPolygonRef.current || initialPolygonRef.current
      if (polygonToShow && draw.current) {
        addPolygonToDraw(polygonToShow)
      }
    }, 50)
  }, [readOnly, mapLoaded, addPolygonToDraw])

  // initialPolygonが外部から変更された場合の処理
  useEffect(() => {
    if (!mapLoaded || !draw.current) return

    if (initialPolygon) {
      addPolygonToDraw(initialPolygon)
      setCurrentPolygon(initialPolygon)
      currentPolygonRef.current = initialPolygon
      setHasChanges(false)
    }
  }, [initialPolygon, mapLoaded, addPolygonToDraw])

  const handleClear = () => {
    if (draw.current) {
      draw.current.deleteAll()
      setCurrentPolygon(null)
      currentPolygonRef.current = null
      setHasChanges(true)
    }
  }

  const handleReset = () => {
    if (draw.current) {
      draw.current.deleteAll()
      if (initialPolygonRef.current) {
        addPolygonToDraw(initialPolygonRef.current)
        setCurrentPolygon(initialPolygonRef.current)
        currentPolygonRef.current = initialPolygonRef.current
      } else {
        setCurrentPolygon(null)
        currentPolygonRef.current = null
      }
      setHasChanges(false)
    }
  }

  const handleSave = () => {
    onSave(currentPolygonRef.current)
    setHasChanges(false)
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

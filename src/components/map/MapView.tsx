import { useEffect, useRef, useState, useCallback } from 'react'
import { mapboxgl, HOKKAIDO_CENTER, DEFAULT_ZOOM, getFieldPolygonColor } from '@/lib/mapbox'
import { useFieldStore } from '@/stores/fieldStore'
import { useSelectedProjectStore } from '@/stores/projectStore'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapViewProps {
  className?: string
  projectId?: string
  onFieldClick?: (fieldId: string) => void
}

export function MapView({ className = '', projectId, onFieldClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [noToken, setNoToken] = useState(false)
  const initialBoundsApplied = useRef(false)

  const { fields, projectFields, fetchFields, fetchProjectFields } = useFieldStore()
  const { getProjectMapBounds, setProjectMapBounds } = useSelectedProjectStore()

  // データを取得
  useEffect(() => {
    if (projectId) {
      fetchFields(projectId)
      fetchProjectFields(projectId)
    } else {
      fetchFields()
    }
  }, [fetchFields, fetchProjectFields, projectId])

  // ポリゴンがある圃場のみをフィルタリング
  // fetchFields(projectId)でプロジェクトの圃場のみ取得しているので、追加のフィルタリングは不要
  const fieldsWithPolygon = fields.filter((field) => {
    if (!field.area_polygon) return false
    return true
  })

  // 圃場の進捗を取得
  const getFieldProgress = (fieldId: string): number => {
    const pf = projectFields.find((p) => p.field_id === fieldId)
    if (!pf || pf.assignments.length === 0) return 0
    return Math.round(
      pf.assignments.reduce((sum, a) => sum + a.progress_pct, 0) / pf.assignments.length
    )
  }

  // 地図の範囲を保存する関数
  const saveMapBounds = useCallback(() => {
    if (!map.current || !projectId) return
    const bounds = map.current.getBounds()
    setProjectMapBounds(projectId, {
      sw: [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
      ne: [bounds.getNorthEast().lng, bounds.getNorthEast().lat],
    })
  }, [projectId, setProjectMapBounds])

  useEffect(() => {
    if (!mapContainer.current) return

    // Mapboxトークンがない場合
    if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
      setNoToken(true)
      return
    }

    // すでに初期化済みの場合はスキップ
    if (map.current) return

    // 保存された範囲を取得
    const savedBounds = projectId ? getProjectMapBounds(projectId) : null

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: HOKKAIDO_CENTER,
      zoom: DEFAULT_ZOOM,
      // 保存された範囲がある場合は初期表示に使用
      ...(savedBounds && {
        bounds: [savedBounds.sw, savedBounds.ne] as [[number, number], [number, number]],
        fitBoundsOptions: { padding: 50 },
      }),
    })

    // 保存された範囲があればフラグを立てる（後でfitBoundsをスキップするため）
    if (savedBounds) {
      initialBoundsApplied.current = true
    }

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left')

    map.current.on('load', () => {
      setMapLoaded(true)
    })

    // 地図の移動・ズーム終了時に範囲を保存
    map.current.on('moveend', saveMapBounds)

    return () => {
      map.current?.remove()
      map.current = null
      initialBoundsApplied.current = false
    }
  }, [projectId, getProjectMapBounds, saveMapBounds])

  // 圃場ポリゴンを表示
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    // 既存のマーカーを削除
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // 既存のレイヤーとソースを削除
    fields.forEach((field) => {
      const sourceId = `field-${field.id}`
      const layerId = `field-fill-${field.id}`
      const outlineId = `field-outline-${field.id}`

      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId)
      }
      if (map.current!.getLayer(outlineId)) {
        map.current!.removeLayer(outlineId)
      }
      if (map.current!.getSource(sourceId)) {
        map.current!.removeSource(sourceId)
      }
    })

    // ポリゴンがない場合は終了
    if (fieldsWithPolygon.length === 0) return

    // 圃場ポリゴンを追加
    fieldsWithPolygon.forEach((field) => {
      if (!field.area_polygon) return

      const polygon = field.area_polygon as { type: string; coordinates: number[][][] }
      if (!polygon.coordinates || polygon.coordinates.length === 0) return

      const progress = getFieldProgress(field.id)
      const label = `${field.farmer.farmer_number}-${field.field_number}`

      const sourceId = `field-${field.id}`
      const layerId = `field-fill-${field.id}`
      const outlineId = `field-outline-${field.id}`

      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            id: field.id,
            label: label,
            farmerName: field.farmer.name,
            progress: progress,
          },
          geometry: {
            type: 'Polygon',
            coordinates: polygon.coordinates,
          },
        },
      })

      // 塗りつぶし
      map.current!.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': getFieldPolygonColor(progress),
          'fill-opacity': 0.6,
        },
      })

      // アウトライン
      map.current!.addLayer({
        id: outlineId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
        },
      })

      // クリックイベント
      map.current!.on('click', layerId, () => {
        onFieldClick?.(field.id)
      })

      // ホバー時のカーソル変更
      map.current!.on('mouseenter', layerId, () => {
        map.current!.getCanvas().style.cursor = 'pointer'
      })
      map.current!.on('mouseleave', layerId, () => {
        map.current!.getCanvas().style.cursor = ''
      })

      // ラベルを追加
      const center = polygon.coordinates[0].reduce(
        (acc, coord) => [acc[0] + coord[0] / polygon.coordinates[0].length, acc[1] + coord[1] / polygon.coordinates[0].length],
        [0, 0]
      )

      const marker = new mapboxgl.Marker({
        element: createLabelElement(label, progress),
      })
        .setLngLat(center as [number, number])
        .addTo(map.current!)

      markersRef.current.push(marker)
    })

    // 圃場にズーム（保存された範囲がない場合のみ）
    if (fieldsWithPolygon.length > 0 && !initialBoundsApplied.current) {
      const bounds = new mapboxgl.LngLatBounds()
      fieldsWithPolygon.forEach((field) => {
        const polygon = field.area_polygon as { type: string; coordinates: number[][][] }
        if (polygon.coordinates && polygon.coordinates[0]) {
          polygon.coordinates[0].forEach((coord) => {
            bounds.extend(coord as [number, number])
          })
        }
      })
      map.current!.fitBounds(bounds, { padding: 50 })
    }
    // 初回のfitBoundsが終わったらフラグをリセット（次回以降の圃場追加時にはfitBoundsを適用）
    // ただし、保存された範囲で初期化した場合は維持
  }, [fields, fieldsWithPolygon, projectFields, mapLoaded, onFieldClick])

  if (noToken) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">地図を表示するにはMapboxトークンが必要です</h3>
          <p className="text-sm text-muted-foreground mb-4">
            .envファイルにVITE_MAPBOX_ACCESS_TOKENを設定してください
          </p>
          {fieldsWithPolygon.length > 0 ? (
            <div className="bg-white rounded-lg p-4 text-left">
              <p className="text-xs text-muted-foreground mb-2">登録済み圃場:</p>
              <ul className="text-sm space-y-1">
                {fieldsWithPolygon.map((field) => {
                  const progress = getFieldProgress(field.id)
                  const label = `${field.farmer.farmer_number}-${field.field_number}`
                  return (
                    <li key={field.id} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: getFieldPolygonColor(progress) }}
                      />
                      <span>{label} ({field.farmer.name}) - 進捗: {progress}%</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              ポリゴンが設定された圃場はありません
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" style={{ minHeight: '400px' }} />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      {fieldsWithPolygon.length === 0 && mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
          <div className="bg-white rounded-lg p-6 text-center">
            <p className="text-muted-foreground">ポリゴンが設定された圃場はありません</p>
            <p className="text-sm text-muted-foreground mt-2">
              圃場詳細画面でポリゴンを設定してください
            </p>
          </div>
        </div>
      )}
      {/* 凡例 */}
      {fieldsWithPolygon.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
          <p className="text-xs font-medium mb-2">進捗状況</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: getFieldPolygonColor(0) }}></div>
              <span>未着手</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: getFieldPolygonColor(50) }}></div>
              <span>進行中</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: getFieldPolygonColor(100) }}></div>
              <span>完了</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function createLabelElement(label: string, progress: number): HTMLElement {
  const el = document.createElement('div')
  el.className = 'bg-white px-2 py-1 rounded shadow-md text-xs font-bold border-2'
  el.style.borderColor = getFieldPolygonColor(progress)
  el.textContent = label
  return el
}

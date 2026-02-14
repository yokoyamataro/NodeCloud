import { useEffect, useRef, useState } from 'react'
import { mapboxgl, HOKKAIDO_CENTER, DEFAULT_ZOOM, getFieldPolygonColor } from '@/lib/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapViewProps {
  className?: string
  onFieldClick?: (fieldId: string) => void
}

// デモ用の圃場ポリゴンデータ
const demoFields = [
  {
    id: 'field-1',
    label: '1-1',
    farmerName: '山田農場',
    progress: 80,
    coordinates: [
      [142.95, 43.05],
      [142.96, 43.05],
      [142.96, 43.04],
      [142.95, 43.04],
      [142.95, 43.05],
    ],
  },
  {
    id: 'field-2',
    label: '1-2',
    farmerName: '山田農場',
    progress: 30,
    coordinates: [
      [142.96, 43.05],
      [142.97, 43.05],
      [142.97, 43.04],
      [142.96, 43.04],
      [142.96, 43.05],
    ],
  },
  {
    id: 'field-3',
    label: '2-1',
    farmerName: '鈴木牧場',
    progress: 0,
    coordinates: [
      [142.95, 43.04],
      [142.96, 43.04],
      [142.96, 43.03],
      [142.95, 43.03],
      [142.95, 43.04],
    ],
  },
]

export function MapView({ className = '', onFieldClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [noToken, setNoToken] = useState(false)

  useEffect(() => {
    if (!mapContainer.current) return

    // Mapboxトークンがない場合
    if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
      setNoToken(true)
      return
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: HOKKAIDO_CENTER,
      zoom: DEFAULT_ZOOM,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left')

    map.current.on('load', () => {
      setMapLoaded(true)

      // 圃場ポリゴンを追加
      demoFields.forEach((field) => {
        const sourceId = `field-${field.id}`
        const layerId = `field-fill-${field.id}`
        const outlineId = `field-outline-${field.id}`

        map.current!.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {
              id: field.id,
              label: field.label,
              farmerName: field.farmerName,
              progress: field.progress,
            },
            geometry: {
              type: 'Polygon',
              coordinates: [field.coordinates],
            },
          },
        })

        // 塗りつぶし
        map.current!.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': getFieldPolygonColor(field.progress),
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
      })

      // ラベルを追加
      demoFields.forEach((field) => {
        const center = field.coordinates.reduce(
          (acc, coord) => [acc[0] + coord[0] / field.coordinates.length, acc[1] + coord[1] / field.coordinates.length],
          [0, 0]
        )

        new mapboxgl.Marker({
          element: createLabelElement(field.label, field.progress),
        })
          .setLngLat(center as [number, number])
          .addTo(map.current!)
      })

      // 圃場にズーム
      const bounds = new mapboxgl.LngLatBounds()
      demoFields.forEach((field) => {
        field.coordinates.forEach((coord) => {
          bounds.extend(coord as [number, number])
        })
      })
      map.current!.fitBounds(bounds, { padding: 50 })
    })

    return () => {
      map.current?.remove()
    }
  }, [onFieldClick])

  if (noToken) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '400px' }}>
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">地図を表示するにはMapboxトークンが必要です</h3>
          <p className="text-sm text-muted-foreground mb-4">
            .envファイルにVITE_MAPBOX_ACCESS_TOKENを設定してください
          </p>
          <div className="bg-white rounded-lg p-4 text-left">
            <p className="text-xs text-muted-foreground mb-2">デモデータ:</p>
            <ul className="text-sm space-y-1">
              {demoFields.map((field) => (
                <li key={field.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: getFieldPolygonColor(field.progress) }}
                  />
                  <span>{field.label} ({field.farmerName}) - 進捗: {field.progress}%</span>
                </li>
              ))}
            </ul>
          </div>
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
      {/* 凡例 */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg p-3 shadow-lg">
        <p className="text-xs font-medium mb-2">進捗状況</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getFieldPolygonColor(0) }}></div>
            <span>0%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getFieldPolygonColor(50) }}></div>
            <span>25-75%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: getFieldPolygonColor(100) }}></div>
            <span>100%</span>
          </div>
        </div>
      </div>
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

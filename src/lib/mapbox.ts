import mapboxgl from 'mapbox-gl'

const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

if (mapboxToken) {
  mapboxgl.accessToken = mapboxToken
} else {
  console.warn('Mapboxアクセストークンが設定されていません。')
}

// 北海道の中心座標（デフォルト）
export const HOKKAIDO_CENTER: [number, number] = [143.0, 43.0]
export const DEFAULT_ZOOM = 8

// 進捗状況に応じたポリゴンの色（未着手:青、進行中:緑、完了:赤）
export function getFieldPolygonColor(progressPct: number): string {
  if (progressPct === 0) return '#3B82F6'      // blue-500 (未着手)
  if (progressPct < 100) return '#22C55E'      // green-500 (進行中)
  return '#EF4444'                              // red-500 (完了)
}

export { mapboxgl }

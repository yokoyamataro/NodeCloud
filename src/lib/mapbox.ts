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

// 進捗状況に応じたポリゴンの色
export function getFieldPolygonColor(progressPct: number): string {
  if (progressPct === 0) return '#9CA3AF'      // gray-400
  if (progressPct < 25) return '#FCA5A5'       // red-300
  if (progressPct < 50) return '#FCD34D'       // yellow-300
  if (progressPct < 75) return '#93C5FD'       // blue-300
  if (progressPct < 100) return '#86EFAC'      // green-300
  return '#22C55E'                              // green-500
}

export { mapboxgl }

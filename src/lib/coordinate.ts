/**
 * 日本の平面直角座標系 ⇔ 緯度経度（WGS84）変換ユーティリティ
 *
 * 北海道は主に以下の系を使用:
 * - 第12系 (XII): 道北地域
 * - 第13系 (XIII): 道南地域
 */

// 平面直角座標系の原点座標（緯度, 経度）
export const JAPAN_PLANE_ORIGINS: Record<number, { lat: number; lng: number; name: string }> = {
  1: { lat: 33.0, lng: 129.5, name: '第I系（長崎県、鹿児島県の一部）' },
  2: { lat: 33.0, lng: 131.0, name: '第II系（福岡県、佐賀県、熊本県等）' },
  3: { lat: 36.0, lng: 132.166666667, name: '第III系（島根県、広島県、山口県等）' },
  4: { lat: 33.0, lng: 133.5, name: '第IV系（香川県、愛媛県、徳島県、高知県）' },
  5: { lat: 36.0, lng: 134.333333333, name: '第V系（兵庫県、鳥取県、岡山県）' },
  6: { lat: 36.0, lng: 136.0, name: '第VI系（京都府、大阪府、福井県等）' },
  7: { lat: 36.0, lng: 137.166666667, name: '第VII系（石川県、富山県、岐阜県）' },
  8: { lat: 36.0, lng: 138.5, name: '第VIII系（新潟県、長野県、山梨県等）' },
  9: { lat: 36.0, lng: 139.833333333, name: '第IX系（東京都、神奈川県、千葉県等）' },
  10: { lat: 40.0, lng: 140.833333333, name: '第X系（青森県、秋田県、山形県等）' },
  11: { lat: 44.0, lng: 140.25, name: '第XI系（北海道：小樽市、函館市等）' },
  12: { lat: 44.0, lng: 142.25, name: '第XII系（北海道：札幌市、旭川市等）' },
  13: { lat: 44.0, lng: 144.25, name: '第XIII系（北海道：北見市、網走市等）' },
  14: { lat: 26.0, lng: 142.0, name: '第XIV系（東京都の島嶼部）' },
  15: { lat: 26.0, lng: 127.5, name: '第XV系（沖縄県）' },
  16: { lat: 26.0, lng: 124.0, name: '第XVI系（沖縄県の一部）' },
  17: { lat: 26.0, lng: 131.0, name: '第XVII系（沖縄県の一部）' },
  18: { lat: 20.0, lng: 136.0, name: '第XVIII系（東京都の島嶼部）' },
  19: { lat: 26.0, lng: 154.0, name: '第XIX系（東京都の島嶼部）' },
}

// 北海道でよく使う座標系
export const HOKKAIDO_ZONES = [11, 12, 13] as const
export type HokkaidoZone = typeof HOKKAIDO_ZONES[number]

// 定数
const A = 6378137.0 // GRS80楕円体の長半径
const F = 1 / 298.257222101 // GRS80楕円体の扁平率
const M0 = 0.9999 // 平面直角座標系の縮尺係数

// 計算用の定数
const E2 = 2 * F - F * F
const E_PRIME2 = E2 / (1 - E2)

// 度 → ラジアン
function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// ラジアン → 度
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

// 子午線弧長の計算
function calcMeridianArc(phi: number): number {
  const n = 1 / (2 * F - 1)
  const n2 = n * n
  const n3 = n2 * n
  const n4 = n3 * n
  const n5 = n4 * n

  const A0 = 1 + n2 / 4 + n4 / 64
  const A2 = -3 / 2 * (n - n3 / 8 - n5 / 64)
  const A4 = 15 / 16 * (n2 - n4 / 4)
  const A6 = -35 / 48 * (n3 - 5 * n5 / 16)
  const A8 = 315 / 512 * n4

  const arc = A * (1 - E2) / (1 - E2) *
    (A0 * phi +
     A2 * Math.sin(2 * phi) +
     A4 * Math.sin(4 * phi) +
     A6 * Math.sin(6 * phi) +
     A8 * Math.sin(8 * phi))

  return arc
}

/**
 * 平面直角座標（X, Y）から緯度経度へ変換
 * @param x X座標（メートル、南北方向）
 * @param y Y座標（メートル、東西方向）
 * @param zone 座標系番号（1-19）
 * @returns [緯度, 経度] (度)
 */
export function planeToLatLng(
  x: number,
  y: number,
  zone: number
): { lat: number; lng: number } {
  const origin = JAPAN_PLANE_ORIGINS[zone]
  if (!origin) {
    throw new Error(`無効な座標系番号: ${zone}`)
  }

  const phi0 = toRad(origin.lat)
  const lambda0 = toRad(origin.lng)

  // 子午線弧長から緯度を求める反復計算
  const m0 = calcMeridianArc(phi0)
  let phi = phi0 + x / M0 / (A * (1 - E2))

  for (let i = 0; i < 10; i++) {
    const m = calcMeridianArc(phi)
    const deltaPhi = (m0 + x / M0 - m) / (A * (1 - E2 * Math.sin(phi) ** 2) ** 1.5)
    phi += deltaPhi
    if (Math.abs(deltaPhi) < 1e-12) break
  }

  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const tanPhi = sinPhi / cosPhi

  const N = A / Math.sqrt(1 - E2 * sinPhi ** 2)
  const t = tanPhi
  const eta2 = E_PRIME2 * cosPhi ** 2

  const y_N = y / (N * M0)
  const y_N2 = y_N * y_N
  const y_N3 = y_N2 * y_N
  const y_N4 = y_N3 * y_N
  const y_N5 = y_N4 * y_N

  // 緯度の計算
  const deltaPhi = -t / 2 * y_N2 * (1 + eta2) +
    t / 24 * y_N4 * (5 + 3 * t ** 2 + 6 * eta2 - 6 * t ** 2 * eta2 - 3 * eta2 ** 2 - 9 * t ** 2 * eta2 ** 2)

  const lat = toDeg(phi + deltaPhi)

  // 経度の計算
  const deltaLambda = y_N / cosPhi -
    y_N3 / (6 * cosPhi) * (1 + 2 * t ** 2 + eta2) +
    y_N5 / (120 * cosPhi) * (5 + 28 * t ** 2 + 24 * t ** 4)

  const lng = toDeg(lambda0 + deltaLambda)

  return { lat, lng }
}

/**
 * 緯度経度から平面直角座標（X, Y）へ変換
 * @param lat 緯度（度）
 * @param lng 経度（度）
 * @param zone 座標系番号（1-19）
 * @returns { x: X座標, y: Y座標 } (メートル)
 */
export function latLngToPlane(
  lat: number,
  lng: number,
  zone: number
): { x: number; y: number } {
  const origin = JAPAN_PLANE_ORIGINS[zone]
  if (!origin) {
    throw new Error(`無効な座標系番号: ${zone}`)
  }

  const phi = toRad(lat)
  const lambda = toRad(lng)
  const phi0 = toRad(origin.lat)
  const lambda0 = toRad(origin.lng)

  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const tanPhi = sinPhi / cosPhi

  const N = A / Math.sqrt(1 - E2 * sinPhi ** 2)
  const t = tanPhi
  const eta2 = E_PRIME2 * cosPhi ** 2

  const m = calcMeridianArc(phi)
  const m0 = calcMeridianArc(phi0)

  const deltaLambda = lambda - lambda0
  const l = deltaLambda * cosPhi
  const l2 = l * l
  const l3 = l2 * l
  const l4 = l3 * l
  const l5 = l4 * l

  // X座標（南北方向）
  const x = M0 * (
    m - m0 +
    N * tanPhi / 2 * l2 +
    N * tanPhi / 24 * (5 - t ** 2 + 9 * eta2 + 4 * eta2 ** 2) * l4
  )

  // Y座標（東西方向）
  const y = M0 * N * (
    l +
    l3 / 6 * (1 - t ** 2 + eta2) +
    l5 / 120 * (5 - 18 * t ** 2 + t ** 4 + 14 * eta2 - 58 * t ** 2 * eta2)
  )

  return { x, y }
}

/**
 * 座標文字列をパース
 * フォーマット: "X,Y" or "X Y" or "X\tY"
 */
export function parseCoordinateString(str: string): { x: number; y: number } | null {
  const cleaned = str.trim().replace(/\s+/g, ',').replace(/、/g, ',')
  const parts = cleaned.split(',').filter(p => p)

  if (parts.length !== 2) return null

  const x = parseFloat(parts[0])
  const y = parseFloat(parts[1])

  if (isNaN(x) || isNaN(y)) return null

  return { x, y }
}

/**
 * 複数の座標点をパース（1行1点）
 */
export function parseCoordinateLines(text: string, zone: number): Array<{ lat: number; lng: number }> {
  const lines = text.split('\n').filter(line => line.trim())
  const coords: Array<{ lat: number; lng: number }> = []

  for (const line of lines) {
    const parsed = parseCoordinateString(line)
    if (parsed) {
      const latLng = planeToLatLng(parsed.x, parsed.y, zone)
      coords.push(latLng)
    }
  }

  return coords
}

/**
 * GeoJSONポリゴン座標を平面直角座標の文字列に変換
 */
export function polygonToPlaneString(
  coordinates: Array<[number, number]>,
  zone: number
): string {
  return coordinates
    .map(([lng, lat]) => {
      const plane = latLngToPlane(lat, lng, zone)
      return `${plane.x.toFixed(3)},${plane.y.toFixed(3)}`
    })
    .join('\n')
}

/**
 * 平面直角座標の配列からGeoJSONポリゴン座標を生成
 */
export function planeToPolygonCoordinates(
  points: Array<{ x: number; y: number }>,
  zone: number
): Array<[number, number]> {
  const coords = points.map(({ x, y }) => {
    const { lat, lng } = planeToLatLng(x, y, zone)
    return [lng, lat] as [number, number]
  })

  // ポリゴンを閉じる（最初の点と最後の点が同じ）
  if (coords.length > 0 &&
      (coords[0][0] !== coords[coords.length - 1][0] ||
       coords[0][1] !== coords[coords.length - 1][1])) {
    coords.push([...coords[0]])
  }

  return coords
}

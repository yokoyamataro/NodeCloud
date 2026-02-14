declare module '@mapbox/mapbox-gl-draw' {
  import type { Map } from 'mapbox-gl'

  interface DrawOptions {
    displayControlsDefault?: boolean
    controls?: {
      point?: boolean
      line_string?: boolean
      polygon?: boolean
      trash?: boolean
      combine_features?: boolean
      uncombine_features?: boolean
    }
    defaultMode?: string
    styles?: object[]
    modes?: object
    userProperties?: boolean
    keybindings?: boolean
    touchEnabled?: boolean
    boxSelect?: boolean
    clickBuffer?: number
    touchBuffer?: number
  }

  interface FeatureCollection {
    type: 'FeatureCollection'
    features: GeoJSON.Feature[]
  }

  class MapboxDraw {
    constructor(options?: DrawOptions)

    onAdd(map: Map): HTMLElement
    onRemove(map: Map): void
    getDefaultPosition(): 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

    add(geojson: GeoJSON.Feature | GeoJSON.FeatureCollection | GeoJSON.Geometry): string[]
    get(featureId: string): GeoJSON.Feature | undefined
    getFeatureIdsAt(point: { x: number; y: number }): string[]
    getSelectedIds(): string[]
    getSelected(): FeatureCollection
    getSelectedPoints(): FeatureCollection
    getAll(): FeatureCollection
    delete(ids: string | string[]): this
    deleteAll(): this
    set(featureCollection: GeoJSON.FeatureCollection): string[]
    trash(): this
    combineFeatures(): this
    uncombineFeatures(): this
    getMode(): string
    changeMode(mode: string, options?: object): this
    setFeatureProperty(featureId: string, property: string, value: any): this
  }

  export default MapboxDraw
}

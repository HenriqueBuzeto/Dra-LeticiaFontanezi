export interface FaceBBox {
  x: number
  y: number
  width: number
  height: number
}

export interface MouthROI {
  x: number
  y: number
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
}

export type MaskData = ImageData | { data: Uint8Array | Uint8ClampedArray; width: number; height: number }

export type RecolorBlendMode = 'multiply' | 'overlay' | 'color'

export interface ManualElasticPoints {
  centerX: number
  centerY: number
  radiusX: number
  radiusY: number
  points?: { x: number; y: number }[]
}

export const ELASTIC_MANUAL_STORAGE_KEY = 'ar-elastic-manual-points'

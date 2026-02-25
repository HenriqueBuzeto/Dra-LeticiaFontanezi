import type { ToothMaskResult } from './types'
import { createImageData, rgbToHsv, luminance } from './imageUtils'

export function runLayer2(
  imageData: ImageData,
  config?: { minBrightness?: number; maxSaturation?: number }
): ToothMaskResult {
  const { width, height, data } = imageData
  const minBrightness = config?.minBrightness ?? 180
  const maxSaturation = config?.maxSaturation ?? 0.35

  const mask = createImageData(width, height)
  const out = mask.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const L = luminance(r, g, b)
    const { s } = rgbToHsv(r, g, b)
    const isTooth = L >= minBrightness && s <= maxSaturation
    const v = isTooth ? 255 : 0
    out[i] = out[i + 1] = out[i + 2] = v
    out[i + 3] = v
  }

  return { mask, width, height }
}

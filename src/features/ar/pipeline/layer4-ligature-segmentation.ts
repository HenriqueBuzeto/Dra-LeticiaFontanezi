import type { BoundingBox } from './types'
import type { LigatureMaskResult } from './types'
import { createImageData, rgbToHsv, findContours, morphologicalOpenSingle } from './imageUtils'
import { DEFAULT_PIPELINE_CONFIG } from './types'

function pointInBox(x: number, y: number, box: BoundingBox): boolean {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height
}

function expandBox(box: BoundingBox, margin: number): BoundingBox {
  return {
    x: Math.max(0, box.x - margin),
    y: Math.max(0, box.y - margin),
    width: box.width + 2 * margin,
    height: box.height + 2 * margin,
  }
}

export function runLayer4(
  imageData: ImageData,
  bracketBoxes: BoundingBox[],
  config: { ligatureMinSaturation?: number; ligatureMinArea?: number; ligatureMaxArea?: number } = {}
): LigatureMaskResult {
  const { width, height, data } = imageData
  const minSat = (config.ligatureMinSaturation ?? DEFAULT_PIPELINE_CONFIG.ligatureMinSaturation) / 255
  const minArea = config.ligatureMinArea ?? DEFAULT_PIPELINE_CONFIG.ligatureMinArea
  const maxArea = config.ligatureMaxArea ?? DEFAULT_PIPELINE_CONFIG.ligatureMaxArea

  const mask = createImageData(width, height)
  const out = mask.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const { s } = rgbToHsv(r, g, b)
    const isHighSaturation = s >= minSat
    const v = isHighSaturation ? 255 : 0
    out[i] = out[i + 1] = out[i + 2] = v
    out[i + 3] = v
  }

  morphologicalOpenSingle(out, width, height, 0)

  const contours = findContours(out, width, height, false)
  const ligatureMask = createImageData(width, height)
  const ligData = ligatureMask.data
  ligatureMask.data.fill(0)

  let totalArea = 0
  let count = 0

  for (const { points, area } of contours) {
    if (area < minArea || area > maxArea) continue
    const cx = points.reduce((s, p) => s + p.x, 0) / points.length
    const cy = points.reduce((s, p) => s + p.y, 0) / points.length
    const nearBracket = bracketBoxes.some((box) => {
      const expanded = expandBox(box, 8)
      return pointInBox(cx, cy, expanded)
    })
    if (!nearBracket) continue
    totalArea += area
    count++
    for (const p of points) {
      const i = (p.y * width + p.x) * 4
      ligData[i] = ligData[i + 1] = ligData[i + 2] = ligData[i + 3] = 255
    }
  }

  const confidence = count > 0 ? Math.min(1, 0.5 + (count / 20) * 0.5) : 0

  return {
    mask: ligatureMask,
    width,
    height,
    confidence,
  }
}

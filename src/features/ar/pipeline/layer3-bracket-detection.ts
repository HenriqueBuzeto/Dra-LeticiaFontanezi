/**
 * CAMADA 3 — Bracket Detection
 * Detectar estruturas metálicas: baixa saturação, alto brilho especular,
 * edge detection, contornos retangulares pequenos, bounding boxes por bracket.
 */

import type { BracketDetectionResult, BoundingBox } from './types'
import { createImageData, rgbToHsv, luminance, findContours } from './imageUtils'

/** Detecta regiões metálicas (baixa saturação, alto brilho) e extrai bboxes de contornos pequenos. */
export function runLayer3(
  imageData: ImageData,
  config?: { minBrightness?: number; maxSaturation?: number; minArea?: number; maxArea?: number }
): BracketDetectionResult {
  const { width, height, data } = imageData
  const minBrightness = config?.minBrightness ?? 140
  const maxSaturation = config?.maxSaturation ?? 0.25
  const minArea = config?.minArea ?? 15
  const maxArea = config?.maxArea ?? 1200

  const metalMask = createImageData(width, height)
  const out = metalMask.data

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const L = luminance(r, g, b)
    const { s } = rgbToHsv(r, g, b)
    const isMetal = L >= minBrightness && s <= maxSaturation
    const v = isMetal ? 255 : 0
    out[i] = out[i + 1] = out[i + 2] = v
    out[i + 3] = v
  }

  const contours = findContours(out, width, height, false)
  const boxes: BoundingBox[] = []

  for (const { points, area } of contours) {
    if (area < minArea || area > maxArea) continue
    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0
    for (const p of points) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
    const w = maxX - minX + 1
    const h = maxY - minY + 1
    const aspect = w / (h || 1)
    if (aspect < 0.2 || aspect > 5) continue
    boxes.push({ x: minX, y: minY, width: w, height: h })
  }

  return { boxes, metalMask }
}

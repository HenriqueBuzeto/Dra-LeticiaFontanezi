import type { FaceBBox, MouthROI } from './types'

export interface Landmark2D {
  x: number
  y: number
  z?: number
}

const LIP_INDICES = [
  61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291,
  78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308,
]

export function faceBBoxFromLandmarks(
  landmarks: Landmark2D[],
  width: number,
  height: number
): FaceBBox | null {
  if (!landmarks.length) return null
  let minX = 1, minY = 1, maxX = 0, maxY = 0
  for (const p of landmarks) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const padding = 0.05
  const w = (maxX - minX) + 2 * padding
  const h = (maxY - minY) + 2 * padding
  const x = Math.max(0, minX - padding)
  const y = Math.max(0, minY - padding)
  return {
    x: Math.floor(x * width),
    y: Math.floor(y * height),
    width: Math.min(Math.ceil(w * width), width),
    height: Math.min(Math.ceil(h * height), height),
  }
}

export function mouthRoiFromLandmarks(
  landmarks: Landmark2D[],
  sourceWidth: number,
  sourceHeight: number
): MouthROI | null {
  const lipPoints = LIP_INDICES.map((i) => landmarks[i]).filter(Boolean)
  if (lipPoints.length < 6) return null

  let minX = 1, minY = 1, maxX = 0, maxY = 0
  for (const p of lipPoints) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const pad = 0.12
  const w = (maxX - minX) + 2 * pad
  const h = (maxY - minY) + 2 * pad
  const x = Math.max(0, minX - pad)
  const y = Math.max(0, minY - pad)
  return {
    x: Math.floor(x * sourceWidth),
    y: Math.floor(y * sourceHeight),
    width: Math.min(Math.ceil(w * sourceWidth), sourceWidth),
    height: Math.min(Math.ceil(h * sourceHeight), sourceHeight),
    sourceWidth,
    sourceHeight,
  }
}

export function cropToRoi(
  imageData: ImageData,
  roi: MouthROI
): ImageData {
  const { x, y, width, height } = roi
  const out = new ImageData(width, height)
  const src = imageData.data
  const sw = imageData.width
  const sh = imageData.height
  const outData = out.data
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const sx = Math.min(sw - 1, Math.max(0, x + i))
      const sy = Math.min(sh - 1, Math.max(0, y + j))
      const si = (sy * sw + sx) * 4
      const oi = (j * width + i) * 4
      outData[oi] = src[si]
      outData[oi + 1] = src[si + 1]
      outData[oi + 2] = src[si + 2]
      outData[oi + 3] = src[si + 3]
    }
  }
  return out
}

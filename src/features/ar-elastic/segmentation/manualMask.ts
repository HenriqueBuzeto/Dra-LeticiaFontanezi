import type { ManualElasticPoints } from '../types'

export function maskFromManualPoints(
  width: number,
  height: number,
  points: ManualElasticPoints
): ImageData {
  const out = new ImageData(width, height)
  const data = out.data
  const cx = points.centerX * width
  const cy = points.centerY * height
  const rx = Math.max(1, points.radiusX * width)
  const ry = Math.max(1, points.radiusY * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      const inside = dx * dx + dy * dy <= 1
      const v = inside ? 255 : 0
      const i = (y * width + x) * 4
      data[i] = data[i + 1] = data[i + 2] = v
      data[i + 3] = 255
    }
  }
  return out
}

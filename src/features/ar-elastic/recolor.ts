import type { RecolorBlendMode } from './types'

function parseHex(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace(/^#/, '')
  const n = parseInt(h.slice(0, 6), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function lum(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function applyRecolor(
  imageData: ImageData,
  mask: { data: Uint8Array | Uint8ClampedArray; width: number; height: number },
  colorHex: string,
  blendMode: RecolorBlendMode = 'overlay'
): void {
  const { data } = imageData
  const maskData = mask.data
  const { r: tr, g: tg, b: tb } = parseHex(colorHex)
  const isDark = lum(tr, tg, tb) < 60

  for (let i = 0; i < data.length; i += 4) {
    const mx = maskData[i >> 2] ?? maskData[i + 3] ?? 0
    if (mx < 20) continue

    const r = data[i], g = data[i + 1], b = data[i + 2]
    const L = lum(r, g, b)
    const t = mx / 255

    let nr: number, ng: number, nb: number
    if (isDark) {
      nr = r + (tr - r) * t
      ng = g + (tg - g) * t
      nb = b + (tb - b) * t
    } else {
      if (blendMode === 'multiply') {
        nr = (r / 255) * (tr / 255) * 255
        ng = (g / 255) * (tg / 255) * 255
        nb = (b / 255) * (tb / 255) * 255
      } else {
        const L2 = lum(tr, tg, tb)
        const blend = L < 128
          ? (2 * (L / 255) * (L2 / 255)) * 255
          : (1 - 2 * (1 - L / 255) * (1 - L2 / 255)) * 255
        const scale = L > 0 ? blend / L : 1
        nr = r * scale
        ng = g * scale
        nb = b * scale
      }
      nr = r + (nr - r) * t
      ng = g + (ng - g) * t
      nb = b + (nb - b) * t
    }
    data[i] = Math.max(0, Math.min(255, nr))
    data[i + 1] = Math.max(0, Math.min(255, ng))
    data[i + 2] = Math.max(0, Math.min(255, nb))
  }
}

export function maskFromSaturation(
  imageData: ImageData,
  minSaturation = 0.15,
  minValue = 0.2,
  maxValue = 0.95
): ImageData {
  const { data, width, height } = imageData
  const out = new ImageData(width, height)
  const o = out.data
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const s = max === 0 ? 0 : (max - min) / max
    const v = max
    const hit = s >= minSaturation && v >= minValue && v <= maxValue
    const v8 = hit ? 255 : 0
    o[i] = o[i + 1] = o[i + 2] = v8
    o[i + 3] = 255
  }
  return out
}

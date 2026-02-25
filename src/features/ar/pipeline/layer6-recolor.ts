import type { RecolorResult } from './types'
import { rgbToHsv } from './imageUtils'

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l * 255
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}
function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

export function parseColorToHS(color: string): { h: number; s: number; v: number; r: number; g: number; b: number } {
  let r = 0,
    g = 0,
    b = 0
  if (color.startsWith('#')) {
    const hex = color.slice(1).replace(/^(.{6}).*/, '$1')
    const n = parseInt(hex, 16)
    if (hex.length >= 6) {
      r = (n >> 16) & 255
      g = (n >> 8) & 255
      b = n & 255
    }
  } else if (color.startsWith('rgba')) {
    const m = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (m) {
      r = +m[1]
      g = +m[2]
      b = +m[3]
    }
  }
  const { h, s, v } = rgbToHsv(r, g, b)
  return { h, s, v, r, g, b }
}

export function runLayer6(
  imageData: ImageData,
  ligatureMask: ImageData,
  selectedColorHex: string
): RecolorResult {
  const { width, height, data } = imageData
  const maskData = ligatureMask.data
  const target = parseColorToHS(selectedColorHex)
  const isDark = target.v < 0.2

  const output = new ImageData(width, height)
  const out = output.data

  for (let i = 0; i < data.length; i += 4) {
    const maskVal = maskData[i + 3] ?? maskData[i]
    if (maskVal < 140) {
      out[i] = data[i]
      out[i + 1] = data[i + 1]
      out[i + 2] = data[i + 2]
      out[i + 3] = data[i + 3]
      continue
    }
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const { v } = rgbToHsv(r, g, b)

    let nr: number, ng: number, nb: number
    if (isDark) {
      nr = target.r
      ng = target.g
      nb = target.b
    } else {
      const L = v
      const [hr, hg, hb] = hslToRgb(target.h, target.s, L)
      nr = hr
      ng = hg
      nb = hb
    }

    const hard = maskVal >= 220 ? 1 : maskVal >= 180 ? 0.7 + (maskVal - 180) / 200 : 0.5 + (maskVal - 140) / 160
    const blend = Math.min(1, hard * 0.98 + 0.02)
    out[i] = Math.round(data[i] * (1 - blend) + nr * blend)
    out[i + 1] = Math.round(data[i + 1] * (1 - blend) + ng * blend)
    out[i + 2] = Math.round(data[i + 2] * (1 - blend) + nb * blend)
    out[i + 3] = data[i + 3]
  }

  return { output }
}

export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSL {
  h: number
  s: number
  l: number
}

export type BlendMode = 'overlay' | 'multiply' | 'color' | 'solid'

export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace(/^#/, '')
  const num = parseInt(cleanHex.slice(0, 6), 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s, l }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  h /= 360
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l // acromático (cinza)
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

/**
 * Calcula a luminosidade perceptiva (fórmula YUV/BT.601)
 */
export function getLuminance({ r, g, b }: RGB): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Aplica a mesclagem de cor realista em um único pixel
 */
export function blendPixel(
  origR: number,
  origG: number,
  origB: number,
  targetColor: RGB,
  alpha: number, // 0 a 1 (intensidade da máscara)
  mode: BlendMode = 'overlay'
): RGB {
  if (alpha <= 0.01) return { r: origR, g: origG, b: origB }

  const tr = targetColor.r
  const tg = targetColor.g
  const tb = targetColor.b

  let nr = origR
  let ng = origG
  let nb = origB

  switch (mode) {
    case 'solid': {
      // Mistura direta linear simples (flat)
      nr = origR + (tr - origR) * alpha
      ng = origG + (tg - origG) * alpha
      nb = origB + (tb - origB) * alpha
      break
    }
    case 'multiply': {
      // Multiply: bom para cores escuras, preserva sombras profundas
      nr = (origR / 255) * (tr / 255) * 255
      ng = (origG / 255) * (tg / 255) * 255
      nb = (origB / 255) * (tb / 255) * 255
      nr = origR + (nr - origR) * alpha
      ng = origG + (ng - origG) * alpha
      nb = origB + (nb - origB) * alpha
      break
    }
    case 'color': {
      // Troca Hue/Saturation no HSL, mantendo luminosidade (L) original
      const origHsl = rgbToHsl({ r: origR, g: origG, b: origB })
      const targetHsl = rgbToHsl(targetColor)
      const mixed = hslToRgb({
        h: targetHsl.h,
        s: targetHsl.s,
        l: origHsl.l, // mantém brilho original
      })
      nr = origR + (mixed.r - origR) * alpha
      ng = origG + (mixed.g - origG) * alpha
      nb = origB + (mixed.b - origB) * alpha
      break
    }
    case 'overlay':
    default: {
      // Overlay: mesclagem avançada para preservar brilhos e sombras
      const L = getLuminance({ r: origR, g: origG, b: origB })
      const targetLum = getLuminance(targetColor)
      
      const blend = L < 128
        ? (2 * (L / 255) * (targetLum / 255)) * 255
        : (1 - 2 * (1 - L / 255) * (1 - targetLum / 255)) * 255
      
      const scale = L > 0 ? blend / L : 1
      const ovR = Math.max(0, Math.min(255, origR * scale))
      const ovG = Math.max(0, Math.min(255, origG * scale))
      const ovB = Math.max(0, Math.min(255, origB * scale))

      // Aplica a matiz (hue) no HSL sobre o resultado para manter cores vibrantes
      const ovHsl = rgbToHsl({ r: ovR, g: ovG, b: ovB })
      const targetHsl = rgbToHsl(targetColor)
      
      const mixed = hslToRgb({
        h: targetHsl.h,
        s: targetHsl.s,
        l: ovHsl.l,
      })

      nr = origR + (mixed.r - origR) * alpha
      ng = origG + (mixed.g - origG) * alpha
      nb = origB + (mixed.b - origB) * alpha
      break
    }
  }

  return {
    r: Math.round(Math.max(0, Math.min(255, nr))),
    g: Math.round(Math.max(0, Math.min(255, ng))),
    b: Math.round(Math.max(0, Math.min(255, nb))),
  }
}

/**
 * Aplica recoloração em uma ImageData com base em uma máscara específica.
 */
export function recolorImageWithMask(
  imageData: ImageData,
  mask: Uint8Array | Uint8ClampedArray,
  colorHex: string,
  mode: BlendMode = 'overlay'
): void {
  const { data } = imageData
  const targetColor = hexToRgb(colorHex)

  for (let i = 0; i < data.length; i += 4) {
    const maskVal = mask[i >> 2] ?? 0
    if (maskVal < 5) continue

    const alpha = maskVal / 255
    const blended = blendPixel(data[i], data[i + 1], data[i + 2], targetColor, alpha, mode)

    data[i] = blended.r
    data[i + 1] = blended.g
    data[i + 2] = blended.b
  }
}

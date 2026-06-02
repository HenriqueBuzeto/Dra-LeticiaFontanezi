import { rgbToHsl } from './colorBlend'

export interface BracketMarker {
  id: string
  x: number // Relative coordinates (0 to 1)
  y: number
  radiusX: number
  radiusY: number
  arch: 'upper' | 'lower'
}

/**
 * Cria a máscara de borrachinhas baseada nos marcadores e regras de exclusão.
 */
export function generateBracketMask(
  width: number,
  height: number,
  markers: BracketMarker[],
  origImageData: ImageData
): Uint8Array {
  const mask = new Uint8Array(width * height)
  const data = origImageData.data

  for (const marker of markers) {
    const cx = marker.x * width
    const cy = marker.y * height
    const rx = marker.radiusX * width
    const ry = marker.radiusY * height

    // Bounding box local do marcador para otimização
    const minX = Math.max(0, Math.floor(cx - rx))
    const maxX = Math.min(width - 1, Math.ceil(cx + rx))
    const minY = Math.max(0, Math.floor(cy - ry))
    const maxY = Math.min(height - 1, Math.ceil(cy + ry))

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = (x - cx) / rx
        const dy = (y - cy) / ry
        const distSq = dx * dx + dy * dy

        // Formato de anel (donut): elipse externa (<= 1.0) e elipse interna (>= 0.22)
        // A elipse interna de 0.22 exclui o centro do bracket metálico
        if (distSq > 1.0 || distSq < 0.22) {
          continue
        }

        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]

        // Converte o pixel original para HSL para avaliar as exclusões
        const hsl = rgbToHsl({ r, g, b })

        // 1. Excluir Dentes (Luminosidade alta e Saturação baixa)
        if (hsl.l > 0.76 && hsl.s < 0.22) {
          continue
        }

        // 2. Excluir Gengivas e Lábios (Tons de rosa/vermelho natural da pele na parte extrema)
        const isRedHue = hsl.h < 26 || hsl.h > 330
        const isGumLightness = hsl.l < 0.65 && hsl.l > 0.15
        if (isRedHue && isGumLightness && hsl.s > 0.15) {
          // Para evitar pintar a gengiva acima das borrachinhas superiores
          if (marker.arch === 'upper' && y < cy - ry * 0.3) {
            continue
          }
          // Para evitar pintar a gengiva abaixo das borrachinhas inferiores
          if (marker.arch === 'lower' && y > cy + ry * 0.3) {
            continue
          }
        }

        // 3. Excluir Fio Metálico Central (Faixa horizontal fina passando pelo centro do bracket)
        // O fio metálico passa horizontalmente perto de cy
        if (Math.abs(y - cy) <= 1.8) {
          continue
        }

        // Se passar por todos os filtros, define o pixel na máscara (intensidade baseada na borda)
        // Suaviza a transição nas bordas do anel
        let edgeWeight = 1.0
        if (distSq > 0.85) {
          edgeWeight = (1.0 - distSq) / 0.15
        } else if (distSq < 0.30) {
          edgeWeight = (distSq - 0.22) / 0.08
        }

        const val = Math.max(0, Math.min(255, Math.round(edgeWeight * 255)))
        const maskIdx = y * width + x
        mask[maskIdx] = val
      }
    }
  }

  return mask
}

/**
 * Aplica Box Blur simples na máscara para efeito de feather.
 */
export function featherMask(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number
): Uint8Array {
  if (radius <= 0) return mask
  
  const blurred = new Uint8Array(width * height)
  const temp = new Uint8Array(width * height)

  // Passo Horizontal
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      let count = 0
      for (let k = -radius; k <= radius; k++) {
        const nx = x + k
        if (nx >= 0 && nx < width) {
          sum += mask[y * width + nx]
          count++
        }
      }
      temp[y * width + x] = Math.round(sum / count)
    }
  }

  // Passo Vertical
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let sum = 0
      let count = 0
      for (let k = -radius; k <= radius; k++) {
        const ny = y + k
        if (ny >= 0 && ny < height) {
          sum += temp[ny * width + x]
          count++
        }
      }
      blurred[y * width + x] = Math.round(sum / count)
    }
  }

  return blurred
}

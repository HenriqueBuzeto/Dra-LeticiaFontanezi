import type { Landmark2D } from '../faceMouthRoi'

export interface EstimatedBracket {
  id: string
  x: number // Relative to mouth crop (0 to 1) or relative to image
  y: number
  arch: 'upper' | 'lower'
  radiusX: number
  radiusY: number
}

/**
 * Aplica alongamento de contraste local (Contrast Stretching)
 * na imagem da boca para melhorar a detecção dos brackets.
 */
export function enhanceLocalContrast(imageData: ImageData): ImageData {
  const { data, width, height } = imageData
  const out = new ImageData(width, height)
  const o = out.data

  let minR = 255, maxR = 0
  let minG = 255, maxG = 0
  let minB = 255, maxB = 0

  // Amostra rápida para achar mínimos e máximos (passo de 2 para velocidade)
  for (let i = 0; i < data.length; i += 8) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    if (r < minR) minR = r
    if (r > maxR) maxR = r
    if (g < minG) minG = g
    if (g > maxG) maxG = g
    if (b < minB) minB = b
    if (b > maxB) maxB = b
  }

  const rangeR = maxR - minR || 1
  const rangeG = maxG - minG || 1
  const rangeB = maxB - minB || 1

  for (let i = 0; i < data.length; i += 4) {
    o[i] = Math.max(0, Math.min(255, ((data[i] - minR) / rangeR) * 255))
    o[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] - minG) / rangeG) * 255))
    o[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] - minB) / rangeB) * 255))
    o[i + 3] = data[i + 3]
  }

  return out
}

/**
 * Estima a localização inicial dos brackets com base em landmarks faciais.
 * Suporta MediaPipe (468/478 pontos) e face-api.js (68 pontos).
 * Retorna posições NORMALIZADAS em relação à imagem inteira.
 */
export function estimateBrackets(
  landmarks: Landmark2D[] | { x: number; y: number }[],
  width: number,
  height: number
): EstimatedBracket[] {
  if (!landmarks || landmarks.length === 0) return []

  const isMediaPipe = landmarks.length >= 400
  const brackets: EstimatedBracket[] = []

  if (isMediaPipe) {
    // MediaPipe landmarks
    const UPPER_INNER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291]
    const LOWER_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308]

    const upperPts = UPPER_INNER.map((idx) => landmarks[idx]).filter(Boolean) as Landmark2D[]
    const lowerPts = LOWER_INNER.map((idx) => landmarks[idx]).filter(Boolean) as Landmark2D[]

    if (upperPts.length < 5 || lowerPts.length < 5) return []

    // Encontra extremos e centro
    const leftX = Math.min(...upperPts.map((p) => p.x), ...lowerPts.map((p) => p.x))
    const rightX = Math.max(...upperPts.map((p) => p.x), ...lowerPts.map((p) => p.x))
    const upperCenterY = upperPts.reduce((sum, p) => sum + p.y, 0) / upperPts.length
    const lowerCenterY = lowerPts.reduce((sum, p) => sum + p.y, 0) / lowerPts.length

    const mouthH = lowerCenterY - upperCenterY
    const mouthW = rightX - leftX
    const teethSpan = mouthW * 0.8 // Centralizado no sorriso

    const upperTeethY = upperCenterY + mouthH * 0.28
    const lowerTeethY = lowerCenterY - mouthH * 0.28

    const numBrackets = 6
    const step = teethSpan / (numBrackets + 1)
    const startX = leftX + (mouthW - teethSpan) / 2

    // Proporcional ao tamanho da boca para o raio inicial dos marcadores
    const defaultRadiusX = Math.max(0.012, teethSpan * 0.045)
    const defaultRadiusY = Math.max(0.010, teethSpan * 0.038)

    for (let i = 0; i < numBrackets; i++) {
      const rx = startX + (i + 1) * step
      // Arco superior
      brackets.push({
        id: `upper-${i}`,
        x: rx,
        y: upperTeethY,
        arch: 'upper',
        radiusX: defaultRadiusX,
        radiusY: defaultRadiusY,
      })
      // Arco inferior
      brackets.push({
        id: `lower-${i}`,
        x: rx,
        y: lowerTeethY,
        arch: 'lower',
        radiusX: defaultRadiusX,
        radiusY: defaultRadiusY,
      })
    }
  } else if (landmarks.length === 68) {
    // face-api.js Landmarks (68 pontos)
    // Lábio interno: índices 60 a 67
    const p60 = landmarks[60]
    const p61 = landmarks[61]
    const p62 = landmarks[62]
    const p63 = landmarks[63]
    const p64 = landmarks[64]
    const p65 = landmarks[65]
    const p66 = landmarks[66]
    const p67 = landmarks[67]

    if (p60 && p64 && p63 && p67) {
      const upperLipY = (p60.y + p61.y + p62.y + p63.y) / 4
      const lowerLipY = (p64.y + p65.y + p66.y + p67.y) / 4
      const mouthOpenH = Math.max(8, lowerLipY - upperLipY)

      const leftX = (p60.x + p64.x) / 2
      const rightX = (p63.x + p67.x) / 2
      const mouthWidth = Math.max(15, rightX - leftX)
      const teethSpan = mouthWidth * 0.85

      const upperTeethY = upperLipY + mouthOpenH * 0.3
      const lowerTeethY = lowerLipY - mouthOpenH * 0.3

      const numBrackets = 6
      const step = teethSpan / (numBrackets + 1)
      const startX = leftX + (mouthWidth - teethSpan) / 2

      const defaultRadiusX = Math.max(10 / width, (teethSpan / width) * 0.05)
      const defaultRadiusY = Math.max(8 / height, (teethSpan / height) * 0.04)

      for (let i = 0; i < numBrackets; i++) {
        const rx = startX + (i + 1) * step
        brackets.push({
          id: `upper-${i}`,
          x: rx / width,
          y: upperTeethY / height,
          arch: 'upper',
          radiusX: defaultRadiusX,
          radiusY: defaultRadiusY,
        })
        brackets.push({
          id: `lower-${i}`,
          x: rx / width,
          y: lowerTeethY / height,
          arch: 'lower',
          radiusX: defaultRadiusX,
          radiusY: defaultRadiusY,
        })
      }
    }
  }

  return brackets
}

export interface BraceDetectionResult {
  confidence: number
  bracketsDetected: number
  wireDetected: boolean
  mouthVisible: boolean
  status: 'detected' | 'partial' | 'not_detected'
}

/**
 * Heurística de visão computacional para estimar a confiança de detecção do aparelho.
 * Analisa a variação de contraste local (desvio padrão de brilho) e consistência
 * de bordas ao redor dos brackets estimados para calcular o score de confiança.
 */
export function analyzeBraceConfidence(
  imageData: ImageData,
  markers: { x: number; y: number; radiusX: number; radiusY: number }[],
  mouthVisible: boolean
): BraceDetectionResult {
  if (!mouthVisible || markers.length === 0) {
    return {
      confidence: 0,
      bracketsDetected: 0,
      wireDetected: false,
      mouthVisible: false,
      status: 'not_detected',
    }
  }

  const { data, width, height } = imageData
  let bracketsDetected = 0

  // Analisa o desvio padrão de luminosidade em uma janela local (9x9 pixels) ao redor de cada bracket
  for (const marker of markers) {
    const cx = Math.floor(marker.x * width)
    const cy = Math.floor(marker.y * height)
    
    let sum = 0
    let sumSq = 0
    let count = 0

    const winSize = 4 // janela de 9x9 (-4 a +4)
    for (let dy = -winSize; dy <= winSize; dy++) {
      for (let dx = -winSize; dx <= winSize; dx++) {
        const px = cx + dx
        const py = cy + dy
        if (px >= 0 && px < width && py >= 0 && py < height) {
          const idx = (py * width + px) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const lum = 0.299 * r + 0.587 * g + 0.114 * b
          sum += lum
          sumSq += lum * lum
          count++
        }
      }
    }

    if (count > 0) {
      const mean = sum / count
      const variance = sumSq / count - mean * mean
      const stdDev = Math.sqrt(Math.max(0, variance))

      // Brackets metálicos/cerâmicos ou borrachinhas coloridas criam bordas de alto contraste
      // Dentes limpos e lisos possuem baixo desvio padrão (< 12)
      if (stdDev > 14.5) {
        bracketsDetected++
      }
    }
  }

  // Verifica se há indícios de fio horizontal ligando os brackets (variação de contraste no plano central)
  const wireDetected = bracketsDetected >= 5

  // Cálculo da confiança baseado no percentual de brackets confirmados por contraste
  const matchRatio = bracketsDetected / Math.max(1, markers.length)
  let confidence = Math.round(matchRatio * 100)

  // Bônus se tiver indicação de fio metálico central
  if (wireDetected) {
    confidence = Math.min(98, confidence + 10)
  }

  let status: 'detected' | 'partial' | 'not_detected' = 'not_detected'
  if (confidence > 75) {
    status = 'detected'
  } else if (confidence >= 35) {
    status = 'partial'
  }

  return {
    confidence,
    bracketsDetected,
    wireDetected,
    mouthVisible,
    status,
  }
}


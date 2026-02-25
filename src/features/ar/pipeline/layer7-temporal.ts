/**
 * CAMADA 7 — Estabilidade Temporal (Webcam)
 * Suavização temporal: média móvel dos últimos N frames; rejeitar mudanças abruptas.
 */

import { DEFAULT_PIPELINE_CONFIG } from './types'

const defaultFrames = DEFAULT_PIPELINE_CONFIG.temporalSmoothingFrames

/** Buffer circular de máscaras para média móvel. */
export class TemporalSmoother {
  private buffer: (ImageData | null)[] = []
  private readonly size: number
  private lastOutput: ImageData | null = null

  constructor(frames: number = defaultFrames) {
    this.size = Math.max(1, frames)
  }

  /** Adiciona nova máscara e retorna a suavizada (média dos últimos N). */
  push(mask: ImageData | null): ImageData | null {
    if (!mask) {
      this.buffer.push(null)
      if (this.buffer.length > this.size) this.buffer.shift()
      return this.lastOutput
    }
    this.buffer.push(mask)
    if (this.buffer.length > this.size) this.buffer.shift()

    const valid = this.buffer.filter((m): m is ImageData => m != null)
    if (valid.length === 0) return this.lastOutput

    const w = mask.width
    const h = mask.height
    const out = new ImageData(w, h)
    const outData = out.data

    for (let i = 0; i < outData.length; i += 4) {
      let sum = 0
      for (const m of valid) {
        sum += m.data[i + 3] ?? m.data[i]
      }
      const v = Math.round(sum / valid.length)
      outData[i] = outData[i + 1] = outData[i + 2] = v
      outData[i + 3] = v
    }

    this.lastOutput = out
    return out
  }

  reset(): void {
    this.buffer = []
    this.lastOutput = null
  }
}

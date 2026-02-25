import type { PipelineFrameResult, PipelineConfig } from './types'
import { DEFAULT_PIPELINE_CONFIG } from './types'
import { initFaceMesh, runLayer1 } from './layer1-face-mouth'
import { runLayer2 } from './layer2-tooth-isolation'
import { runLayer3 } from './layer3-bracket-detection'
import { runLayer4 } from './layer4-ligature-segmentation'
import { runLayer5 } from './layer5-ml-refine'
import { runLayer6 } from './layer6-recolor'
import { TemporalSmoother } from './layer7-temporal'
import { cropImageData } from './imageUtils'

const MIN_CONFIDENCE = 0.85

export type { PipelineFrameResult, PipelineConfig }
export { initFaceMesh, DEFAULT_PIPELINE_CONFIG }

let temporalSmoother: TemporalSmoother | null = null
let config: PipelineConfig = DEFAULT_PIPELINE_CONFIG

export function setPipelineConfig(cfg: Partial<PipelineConfig>): void {
  config = { ...DEFAULT_PIPELINE_CONFIG, ...cfg }
  temporalSmoother = new TemporalSmoother(config.temporalSmoothingFrames)
}

function getWorkCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx }
}

let workCanvas: ReturnType<typeof getWorkCanvas> | null = null
function getOrCreateWorkCanvas(): ReturnType<typeof getWorkCanvas> {
  if (!workCanvas) workCanvas = getWorkCanvas()
  return workCanvas
}

export async function runPipelineFrame(
  video: HTMLVideoElement,
  selectedColor: string
): Promise<PipelineFrameResult> {
  const w = video.videoWidth
  const h = video.videoHeight
  if (w <= 0 || h <= 0 || video.readyState < 2) {
    return { ligatureMask: null, outputFrame: null, confidence: 0, warning: 'Vídeo não pronto.' }
  }

  if (!temporalSmoother) temporalSmoother = new TemporalSmoother(config.temporalSmoothingFrames)

  const mesh = await initFaceMesh()
  if (!mesh) {
    return {
      ligatureMask: null,
      outputFrame: null,
      confidence: 0,
      warning: 'MediaPipe Face Mesh não disponível.',
    }
  }

  const layer1Result = await runLayer1(mesh, video, w, h)
  if (!layer1Result || !layer1Result.mouthOpen) {
    return {
      ligatureMask: null,
      outputFrame: null,
      confidence: layer1Result?.confidence ?? 0,
      warning: layer1Result && !layer1Result.mouthOpen ? 'Mantenha a boca levemente aberta.' : undefined,
    }
  }

  const { mouthBBox } = layer1Result
  const { canvas, ctx } = getOrCreateWorkCanvas()
  canvas.width = w
  canvas.height = h
  ctx.drawImage(video, 0, 0)
  let fullImageData: ImageData
  try {
    fullImageData = ctx.getImageData(0, 0, w, h)
  } catch {
    return { ligatureMask: null, outputFrame: null, confidence: 0, warning: 'Falha ao ler frame.' }
  }

  const cropW = Math.max(32, Math.round(mouthBBox.width))
  const cropH = Math.max(32, Math.round(mouthBBox.height))
  const cropX = Math.max(0, Math.round(mouthBBox.x))
  const cropY = Math.max(0, Math.round(mouthBBox.y))
  const cropped = cropImageData(fullImageData, cropX, cropY, cropW, cropH)

  runLayer2(cropped)
  const layer3 = runLayer3(cropped)
  const layer4 = runLayer4(cropped, layer3.boxes, {
    ligatureMinSaturation: config.ligatureMinSaturation,
    ligatureMinArea: config.ligatureMinArea,
    ligatureMaxArea: config.ligatureMaxArea,
  })
  const layer5 = runLayer5(layer4.mask, cropped, layer4.confidence)

  const smoothedMask = temporalSmoother.push(layer5.mask)
  if (!smoothedMask) {
    return {
      ligatureMask: null,
      outputFrame: null,
      confidence: layer5.confidence,
      warning: layer5.confidence < MIN_CONFIDENCE ? 'Não foi possível detectar ligaduras com precisão.' : undefined,
    }
  }

  if (layer5.confidence < config.minConfidenceThreshold) {
    return {
      ligatureMask: smoothedMask,
      outputFrame: null,
      confidence: layer5.confidence,
      warning: 'Não foi possível detectar ligaduras com precisão.',
    }
  }

  const fullMask = new ImageData(w, h)
  fullMask.data.fill(0)
  const smData = smoothedMask.data
  const fullData = fullMask.data
  for (let j = 0; j < smoothedMask.height; j++) {
    for (let i = 0; i < smoothedMask.width; i++) {
      const si = (j * smoothedMask.width + i) * 4
      const fx = cropX + i
      const fy = cropY + j
      if (fx >= w || fy >= h) continue
      const fi = (fy * w + fx) * 4
      const v = smData[si + 3] ?? smData[si]
      fullData[fi] = fullData[fi + 1] = fullData[fi + 2] = fullData[fi + 3] = v
    }
  }

  const recolorResult = runLayer6(fullImageData, fullMask, selectedColor)
  return {
    ligatureMask: fullMask,
    outputFrame: recolorResult.output,
    confidence: layer5.confidence,
  }
}

export function resetTemporalSmoothing(): void {
  temporalSmoother?.reset()
}

export interface Point2D {
  x: number
  y: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface FaceMouthResult {
  mouthPolygon: Point2D[]
  mouthBBox: BoundingBox
  mouthOpen: boolean
  confidence: number
}

export interface ToothMaskResult {
  mask: ImageData
  width: number
  height: number
}

export interface BracketDetectionResult {
  boxes: BoundingBox[]
  metalMask: ImageData
}

export interface LigatureMaskResult {
  mask: ImageData
  width: number
  height: number
  confidence: number
}

export interface MLRefineResult {
  mask: ImageData
  confidence: number
  mlUsed: boolean
}

export interface RecolorResult {
  output: ImageData
}

export interface PipelineFrameResult {
  ligatureMask: ImageData | null
  outputFrame: ImageData | null
  confidence: number
  warning?: string
}

export interface PipelineConfig {
  ligatureMinSaturation: number
  ligatureMinArea: number
  ligatureMaxArea: number
  temporalSmoothingFrames: number
  minConfidenceThreshold: number
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  ligatureMinSaturation: 80,
  ligatureMinArea: 20,
  ligatureMaxArea: 800,
  temporalSmoothingFrames: 5,
  minConfidenceThreshold: 0.85,
}

import type { MLRefineResult } from './types'

let tfjsModelLoaded = false

export async function loadSegmenterModel(): Promise<boolean> {
  if (tfjsModelLoaded) return true
  try {
    tfjsModelLoaded = false
    return false
  } catch {
    return false
  }
}

export function runLayer5(
  ligatureMaskHeuristic: ImageData,
  _fullFrameImageData: ImageData,
  heuristicConfidence: number
): MLRefineResult {
  return {
    mask: ligatureMaskHeuristic,
    confidence: heuristicConfidence,
    mlUsed: false,
  }
}

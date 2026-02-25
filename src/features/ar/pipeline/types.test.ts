import { describe, it, expect } from 'vitest'
import { DEFAULT_PIPELINE_CONFIG } from './types'

const EXPECTED_MIN_CONFIDENCE = 0.85

describe('pipeline types', () => {
  it('DEFAULT_PIPELINE_CONFIG tem todos os campos esperados', () => {
    expect(DEFAULT_PIPELINE_CONFIG.ligatureMinSaturation).toBeGreaterThan(0)
    expect(DEFAULT_PIPELINE_CONFIG.ligatureMinArea).toBeGreaterThan(0)
    expect(DEFAULT_PIPELINE_CONFIG.ligatureMaxArea).toBeGreaterThan(DEFAULT_PIPELINE_CONFIG.ligatureMinArea)
    expect(DEFAULT_PIPELINE_CONFIG.temporalSmoothingFrames).toBeGreaterThanOrEqual(1)
    expect(DEFAULT_PIPELINE_CONFIG.minConfidenceThreshold).toBeGreaterThan(0)
    expect(DEFAULT_PIPELINE_CONFIG.minConfidenceThreshold).toBeLessThanOrEqual(1)
  })
  it('minConfidenceThreshold é 0.85 para failsafe', () => {
    expect(DEFAULT_PIPELINE_CONFIG.minConfidenceThreshold).toBe(EXPECTED_MIN_CONFIDENCE)
  })
})

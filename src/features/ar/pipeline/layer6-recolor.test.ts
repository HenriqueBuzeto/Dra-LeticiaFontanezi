import { describe, it, expect } from 'vitest'
import { parseColorToHS } from './layer6-recolor'

describe('layer6-recolor parseColorToHS', () => {
  it('parseia hex #83a781', () => {
    const { h, s } = parseColorToHS('#83a781')
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(360)
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(1)
  })
  it('parseia hex curto #fff', () => {
    const { s } = parseColorToHS('#FFFFFF')
    expect(s).toBe(0)
  })
  it('parseia rgba', () => {
    const { s } = parseColorToHS('rgba(255,255,255,0.9)')
    expect(s).toBe(0)
  })
  it('retorna H e S numéricos para cores válidas', () => {
    const colors = ['#EF4444', '#22C55E', '#60A5FA']
    for (const color of colors) {
      const { h, s } = parseColorToHS(color)
      expect(Number.isFinite(h)).toBe(true)
      expect(Number.isFinite(s)).toBe(true)
    }
  })
})

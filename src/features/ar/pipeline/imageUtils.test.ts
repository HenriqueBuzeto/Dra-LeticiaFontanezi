import { describe, it, expect } from 'vitest'
import { rgbToHsv, luminance } from './imageUtils'

describe('imageUtils', () => {
  describe('rgbToHsv', () => {
    it('converte preto para V=0', () => {
      const { s, v } = rgbToHsv(0, 0, 0)
      expect(v).toBe(0)
      expect(s).toBe(0)
    })
    it('converte branco para S=0, V=1', () => {
      const { s, v } = rgbToHsv(255, 255, 255)
      expect(s).toBe(0)
      expect(v).toBe(1)
    })
    it('converte vermelho puro para H~0, S=1, V=1', () => {
      const { h, s, v } = rgbToHsv(255, 0, 0)
      expect(h).toBeCloseTo(0, 0)
      expect(s).toBe(1)
      expect(v).toBe(1)
    })
    it('converte verde puro para H~120', () => {
      const { h } = rgbToHsv(0, 255, 0)
      expect(h).toBeCloseTo(120, 0)
    })
    it('converte azul puro para H~240', () => {
      const { h } = rgbToHsv(0, 0, 255)
      expect(h).toBeCloseTo(240, 0)
    })
  })

  describe('luminance', () => {
    it('preto retorna 0', () => {
      expect(luminance(0, 0, 0)).toBe(0)
    })
    it('branco retorna 255', () => {
      expect(luminance(255, 255, 255)).toBe(255)
    })
    it('valor intermediário está entre 0 e 255', () => {
      const L = luminance(100, 150, 80)
      expect(L).toBeGreaterThanOrEqual(0)
      expect(L).toBeLessThanOrEqual(255)
    })
  })
})

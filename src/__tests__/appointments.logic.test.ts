import { describe, it, expect } from 'vitest'

function getDaysInMonth(year: number, month: number) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const days = last.getDate()
  return { startPad, days, year, month }
}

function isAppointmentFuture(apt: { data: string; status: string }): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return apt.data >= today && apt.status !== 'cancelado'
}

describe('Appointments logic', () => {
  describe('getDaysInMonth', () => {
    it('retorna número correto de dias para fevereiro 2024 (bissexto)', () => {
      const r = getDaysInMonth(2024, 1)
      expect(r.days).toBe(29)
      expect(r.year).toBe(2024)
      expect(r.month).toBe(1)
    })

    it('retorna 31 dias para janeiro', () => {
      const r = getDaysInMonth(2025, 0)
      expect(r.days).toBe(31)
    })

    it('startPad é 0 quando o dia 1 cai em domingo', () => {
      const r = getDaysInMonth(2023, 0)
      expect(r.startPad).toBe(0)
    })
  })

  describe('isAppointmentFuture', () => {
    it('retorna false quando status é cancelado', () => {
      const today = new Date().toISOString().slice(0, 10)
      expect(isAppointmentFuture({ data: today, status: 'cancelado' })).toBe(false)
    })

    it('retorna true quando data é hoje e status confirmado', () => {
      const today = new Date().toISOString().slice(0, 10)
      expect(isAppointmentFuture({ data: today, status: 'confirmado' })).toBe(true)
    })

    it('retorna true quando data é futura', () => {
      const future = '2030-12-31'
      expect(isAppointmentFuture({ data: future, status: 'pendente' })).toBe(true)
    })

    it('retorna false quando data é passada', () => {
      expect(isAppointmentFuture({ data: '2020-01-01', status: 'confirmado' })).toBe(false)
    })
  })
})

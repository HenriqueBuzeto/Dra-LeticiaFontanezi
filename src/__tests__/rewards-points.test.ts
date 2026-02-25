import { describe, it, expect } from 'vitest'

const POINTS_BY_ACTION: Record<string, number> = {
  escovacao: 5,
  fio_dental: 5,
  consulta_presente: 25,
  limpeza_bucal: 15,
  uso_enxaguante: 5,
  checkin_semanal: 20,
}

function getPointsForAction(action: string): number {
  return POINTS_BY_ACTION[action] ?? 10
}

describe('Points / Rewards', () => {
  it('ações conhecidas retornam pontos corretos', () => {
    expect(getPointsForAction('escovacao')).toBe(5)
    expect(getPointsForAction('fio_dental')).toBe(5)
    expect(getPointsForAction('consulta_presente')).toBe(25)
    expect(getPointsForAction('limpeza_bucal')).toBe(15)
    expect(getPointsForAction('uso_enxaguante')).toBe(5)
    expect(getPointsForAction('checkin_semanal')).toBe(20)
  })

  it('ação desconhecida retorna fallback 10', () => {
    expect(getPointsForAction('outra')).toBe(10)
  })

  it('total de pontos é soma dos logs (simulado)', () => {
    const logs = [
      { points: 5 },
      { points: 25 },
      { points: 5 },
    ]
    const total = logs.reduce((s, l) => s + l.points, 0)
    expect(total).toBe(35)
  })
})

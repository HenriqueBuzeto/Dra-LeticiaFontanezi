import { describe, it, expect } from 'vitest'
import { getApiErrorMessage } from '@/lib/apiError'

describe('API error message', () => {
  it('retorna fallback quando err é null', () => {
    expect(getApiErrorMessage(null, 'Erro ao fazer login.')).toBe('Erro ao fazer login.')
  })

  it('retorna mensagem única do backend', () => {
    const err = { response: { data: { message: 'Credenciais inválidas' } } }
    expect(getApiErrorMessage(err, 'Erro')).toBe('Credenciais inválidas')
  })

  it('retorna primeiro item quando message é array (validation)', () => {
    const err = { response: { data: { message: ['email must be an email', 'password is required'] } } }
    expect(getApiErrorMessage(err, 'Erro')).toBe('email must be an email')
  })

  it('retorna mensagem de rede quando code é ERR_NETWORK', () => {
    const err = { code: 'ERR_NETWORK' }
    expect(getApiErrorMessage(err, 'Erro')).toContain('Não foi possível conectar')
  })

  it('retorna fallback quando response existe mas sem message', () => {
    const err = { response: { status: 500 } }
    expect(getApiErrorMessage(err, 'Erro interno')).toBe('Erro interno')
  })
})

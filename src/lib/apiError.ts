export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback
  if (err instanceof Error && err.message) return err.message
  const ax = err as { response?: { data?: { message?: string | string[] }; status?: number }; code?: string }
  if (ax.response?.data?.message) {
    const m = ax.response.data.message
    return Array.isArray(m) ? m[0] : m
  }
  if (ax.code === 'ERR_NETWORK' || !ax.response) {
    return 'Não foi possível conectar ao servidor. Confira: (1) NEXT_PUBLIC_API_URL na Vercel aponta para o backend NestJS; (2) backend está no ar (Railway/Render); (3) redeploy após salvar a variável.'
  }
  if (ax.response?.status === 401) return 'E-mail ou senha incorretos.'
  if (ax.response?.status === 404)
    return 'Rota não encontrada. O backend está rodando? A URL em NEXT_PUBLIC_API_URL está correta?'
  if (ax.response?.status === 500)
    return 'Erro no servidor (500). Pode ser banco de dados ou configuração do backend. Veja os logs do backend.'
  const status = ax.response?.status
  if (status) return `${fallback} (Status: ${status})`
  return fallback
}

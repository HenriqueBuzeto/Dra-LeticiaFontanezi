export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback
  const ax = err as { response?: { data?: { message?: string | string[] } }; code?: string }
  if (ax.response?.data?.message) {
    const m = ax.response.data.message
    return Array.isArray(m) ? m[0] : m
  }
  if (ax.code === 'ERR_NETWORK' || !ax.response)
    return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.'
  return fallback
}

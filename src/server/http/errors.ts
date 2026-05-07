export function toHttpError(err: unknown): { status: number; body: { message: string } } {
  const msg = err instanceof Error ? err.message : 'Internal error'
  if (msg === 'UNAUTHORIZED') return { status: 401, body: { message: 'Não autenticado' } }
  if (msg === 'FORBIDDEN') return { status: 403, body: { message: 'Acesso negado' } }
  if (msg === 'BAD_REQUEST') return { status: 400, body: { message: 'Requisição inválida' } }
  return { status: 500, body: { message: msg } }
}

import type { user } from '@/server/db/schema'

export function toUserResponse(u: typeof user.$inferSelect) {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    telefone: u.telefone ?? undefined,
    telefoneAlternativo: u.telefoneAlternativo ?? undefined,
    dataNascimento: u.dataNascimento ?? undefined,
    genero: u.genero ?? undefined,
    role: u.role as 'admin' | 'paciente',
    avatar: u.avatar ?? undefined,
    endereco: (u.endereco as any) ?? undefined,
    contatoEmergencia: (u.contatoEmergencia as any) ?? undefined,
    preferenciaLembrete: (u.preferenciaLembrete as any) ?? undefined,
  }
}

import { describe, it, expect } from 'vitest'

const DEMO_VIDEOS = [
  { id: '1', titulo: 'Vídeo 1', url: '#', categoria: 'higiene', duracao: 3, thumbnail: 'https://example.com/1.jpg' },
  { id: '2', titulo: 'Vídeo 2', url: '#', categoria: 'outros', duracao: 5, thumbnail: 'https://example.com/2.jpg' },
]

function normalizeVideosFromApi(list: unknown): { id: string; titulo: string; url: string; categoria: string; duracao?: number; thumbnail?: string }[] {
  if (!Array.isArray(list)) return []
  return list.map((v: Record<string, unknown>) => ({
    id: String(v.id ?? ''),
    titulo: String(v.titulo ?? ''),
    url: String(v.url ?? ''),
    categoria: String(v.categoria ?? 'outros'),
    duracao: typeof v.duracao === 'number' ? v.duracao : undefined,
    thumbnail: v.thumbnail ? String(v.thumbnail) : undefined,
  }))
}

describe('Videos list', () => {
  it('normaliza lista da API com todos os campos', () => {
    const api = [
      { id: 'a', titulo: 'T', url: 'https://x.com', categoria: 'higiene', duracao: 10, thumbnail: 'https://thumb' },
    ]
    const out = normalizeVideosFromApi(api)
    expect(out).toHaveLength(1)
    expect(out[0]).toEqual({ id: 'a', titulo: 'T', url: 'https://x.com', categoria: 'higiene', duracao: 10, thumbnail: 'https://thumb' })
  })

  it('retorna array vazio quando não é array', () => {
    expect(normalizeVideosFromApi(null)).toEqual([])
    expect(normalizeVideosFromApi(undefined)).toEqual([])
    expect(normalizeVideosFromApi({})).toEqual([])
  })

  it('usa fallback para campos faltando', () => {
    const out = normalizeVideosFromApi([{ id: '1' }])
    expect(out[0].titulo).toBe('')
    expect(out[0].categoria).toBe('outros')
    expect(out[0].duracao).toBeUndefined()
  })

  it('fallback para exibição quando API falha: usa demo', () => {
    const failed = normalizeVideosFromApi(null)
    const displayList = failed.length > 0 ? failed : DEMO_VIDEOS.map((v) => ({ ...v, descricao: undefined }))
    expect(displayList.length).toBe(DEMO_VIDEOS.length)
  })
})

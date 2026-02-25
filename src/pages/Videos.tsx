'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Video as VideoIcon, Play } from 'lucide-react'
import { api } from '@/lib/api'
import type { Video } from '@/types'
import { Carousel, CarouselCard } from '@/components/ui/Carousel'
import { DEMO_VIDEOS, IMAGES } from '@/data/demo'
import { VideoCardSkeleton } from '@/components/ui/Skeleton'

const CATEGORIAS: Record<string, string> = {
  higiene: 'Higiene',
  primeira_consulta: 'Primeira consulta',
  cuidados_aparelho: 'Cuidados com aparelho',
  outros: 'Outros',
}

type VideoItem = {
  id: string
  titulo: string
  descricao?: string
  url: string
  thumbnail?: string
  categoria: string
  duracao?: number
}

export default function Videos() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Video[]>('/videos')
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : []
        setVideos(
          list.map((v) => ({
            id: v.id,
            titulo: v.titulo,
            descricao: v.descricao,
            url: v.url,
            thumbnail: v.thumbnail ?? IMAGES.videoBrush,
            categoria: v.categoria,
            duracao: v.duracao,
          }))
        )
      })
      .catch(() => {
        setVideos(
          DEMO_VIDEOS.map((v) => ({
            id: v.id,
            titulo: v.titulo,
            url: v.url,
            thumbnail: v.thumbnail,
            categoria: v.categoria,
            duracao: v.duracao,
          }))
        )
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered =
    filter
      ? videos.filter((v) => (v.categoria || '').toLowerCase().replace(/\s/g, '_') === filter || (CATEGORIAS[filter] && (v.categoria || '').toLowerCase() === CATEGORIAS[filter].toLowerCase()))
      : videos
  const carouselVideos = videos.length > 0 ? videos : DEMO_VIDEOS.map((v) => ({
    id: v.id,
    titulo: v.titulo,
    url: v.url,
    thumbnail: v.thumbnail,
    categoria: v.categoria,
    duracao: v.duracao,
  }))

  return (
    <div className="px-4 lg:px-0 py-6">
      <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-4">Vídeos informativos</h1>

      {/* Carrossel: Vídeos em destaque (com imagens) */}
      {!loading && carouselVideos.length > 0 && (
        <Carousel title="Em destaque" className="mb-8">
          {(carouselVideos as VideoItem[]).slice(0, 4).map((v) => (
            <CarouselCard key={v.id}>
              <a
                href={v.url?.startsWith('http') ? v.url : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl overflow-hidden bg-white shadow-soft border border-gray-mist/50 group"
              >
                <div className="aspect-video relative">
                  <img
                    src={v.thumbnail ?? IMAGES.videoBrush}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                      <Play className="h-7 w-7 text-olive ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded">
                    {v.duracao ?? 0} min
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-800 line-clamp-2">{v.titulo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {CATEGORIAS[v.categoria] ?? v.categoria}
                  </p>
                </div>
              </a>
            </CarouselCard>
          ))}
        </Carousel>
      )}

      {/* Filtros por categoria */}
      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={`px-4 py-2 rounded-2xl text-sm font-medium shrink-0 transition-colors ${
            filter === null ? 'bg-olive text-white' : 'bg-gray-mist text-gray-700 hover:bg-gray-mistDark'
          }`}
        >
          Todos
        </button>
        {Object.entries(CATEGORIAS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-2xl text-sm font-medium shrink-0 transition-colors ${
              filter === key ? 'bg-olive text-white' : 'bg-gray-mist text-gray-700 hover:bg-gray-mistDark'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Painel de vídeos (grid) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <VideoCardSkeleton />
          <VideoCardSkeleton />
          <VideoCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v, i) => (
            <motion.a
              key={v.id}
              href={v.url?.startsWith('http') ? v.url : '#'}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.2) }}
              className="block rounded-2xl overflow-hidden bg-white shadow-soft border border-gray-mist/50 group"
            >
              <div className="aspect-video relative">
                <img
                  src={v.thumbnail ?? IMAGES.videoBrush}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg">
                    <Play className="h-7 w-7 text-olive ml-1" fill="currentColor" />
                  </div>
                </div>
                {v.duracao != null && (
                  <span className="absolute bottom-2 right-2 text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded">
                    {v.duracao} min
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-gray-800 line-clamp-2">{v.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{CATEGORIAS[v.categoria] ?? v.categoria}</p>
              </div>
            </motion.a>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <VideoIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum vídeo nesta categoria.</p>
          <Link href="/doctor" className="text-olive text-sm font-medium mt-2 inline-block">
            Ver informações da Dra.
          </Link>
        </div>
      )}

      {/* Link para perfil da Dra */}
      <div className="mt-8">
        <Link
          href="/doctor"
          className="block rounded-2xl bg-olive/5 border border-olive/20 p-4 text-center text-olive font-medium text-sm hover:bg-olive/10 transition-colors"
        >
          Ver perfil da Dra. Letícia e dicas
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Video as VideoIcon, Link2, FolderUp, ImagePlus } from 'lucide-react'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toaster'

type VideoItem = {
  id: string
  titulo: string
  descricao?: string
  url: string
  thumbnail?: string
  categoria: string
  duracao?: number
}

const CATEGORIAS = ['higiene', 'primeira_consulta', 'cuidados_aparelho', 'outros']

type VideoInputMode = 'url' | 'file'
type ThumbnailInputMode = 'url' | 'file'

export default function AdminVideos() {
  const { toast } = useToast()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ titulo: '', descricao: '', url: '', thumbnail: '', categoria: 'outros', duracao: 0 })
  const [videoMode, setVideoMode] = useState<VideoInputMode>('url')
  const [thumbnailMode, setThumbnailMode] = useState<ThumbnailInputMode>('url')
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [videoFileName, setVideoFileName] = useState<string | null>(null)
  const [thumbFileName, setThumbFileName] = useState<string | null>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    api
      .get<VideoItem[]>('/videos')
      .then((r) => setVideos(Array.isArray(r.data) ? r.data : []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setForm({ titulo: '', descricao: '', url: '', thumbnail: '', categoria: 'outros', duracao: 0 })
    setVideoMode('url')
    setThumbnailMode('url')
    setVideoFileName(null)
    setThumbFileName(null)
    setEditingId(null)
    setModal('add')
  }
  const openEdit = (v: VideoItem) => {
    setForm({
      titulo: v.titulo,
      descricao: v.descricao ?? '',
      url: v.url,
      thumbnail: v.thumbnail ?? '',
      categoria: v.categoria,
      duracao: v.duracao ?? 0,
    })
    setVideoMode(v.url?.startsWith('/api/uploads/') ? 'file' : 'url')
    setThumbnailMode(v.thumbnail?.startsWith('/api/uploads/') ? 'file' : 'url')
    setVideoFileName(v.url?.startsWith('/api/uploads/') ? v.url.split('/').pop() ?? null : null)
    setThumbFileName(v.thumbnail?.startsWith('/api/uploads/') ? v.thumbnail.split('/').pop() ?? null : null)
    setEditingId(v.id)
    setModal('edit')
  }
  const closeModal = () => {
    setModal(null)
    setEditingId(null)
    setVideoFileName(null)
    setThumbFileName(null)
  }

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingVideo(true)
    setVideoFileName(file.name)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<{ url: string }>('/videos/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm((f) => ({ ...f, url: data.url }))
      toast('Vídeo enviado. Salve o formulário para confirmar.', 'success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao enviar vídeo.'
      toast(msg, 'error')
      setVideoFileName(null)
    } finally {
      setUploadingVideo(false)
      e.target.value = ''
    }
  }

  const handleThumbnailFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumb(true)
    setThumbFileName(file.name)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<{ url: string }>('/videos/upload-thumbnail', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setForm((f) => ({ ...f, thumbnail: data.url }))
      toast('Imagem enviada. Salve o formulário para confirmar.', 'success')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao enviar imagem.'
      toast(msg, 'error')
      setThumbFileName(null)
    } finally {
      setUploadingThumb(false)
      e.target.value = ''
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      titulo: form.titulo,
      descricao: form.descricao || undefined,
      url: form.url,
      thumbnail: form.thumbnail || undefined,
      categoria: form.categoria,
      duracao: form.duracao || undefined,
    }
    try {
      if (editingId) {
        await api.patch(`/videos/${editingId}`, payload)
        toast('Vídeo atualizado.', 'success')
      } else {
        await api.post('/videos', payload)
        toast('Vídeo adicionado.', 'success')
      }
      closeModal()
      load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao salvar.', 'error')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('Remover este vídeo?')) return
    try {
      await api.delete(`/videos/${id}`)
      toast('Vídeo removido.', 'success')
      load()
    } catch {
      toast('Erro ao remover.', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-night-text">Vídeos</h1>
          <p className="text-gray-500 dark:text-night-muted text-sm mt-0.5">Adicione, edite ou remova vídeos do site.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-olive text-white font-medium shadow-button hover:opacity-95"
        >
          <Plus className="h-5 w-5" />
          Adicionar vídeo
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card overflow-hidden">
          <div className="h-64 flex items-center justify-center text-gray-400 dark:text-night-muted">Carregando...</div>
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card p-12 text-center">
          <VideoIcon className="h-12 w-12 text-gray-400 dark:text-night-muted mx-auto mb-4" />
          <p className="text-gray-600 dark:text-night-muted">Nenhum vídeo cadastrado.</p>
          <button type="button" onClick={openAdd} className="mt-4 text-olive dark:text-olive-light font-medium">
            Adicionar o primeiro vídeo
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-mist/50 dark:border-night-border bg-white dark:bg-night-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-mist/50 dark:border-night-border bg-gray-mist/30 dark:bg-night-surface">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Título</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Categoria</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase">Duração</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-night-muted uppercase w-28">Ações</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id} className="border-b border-gray-mist/30 dark:border-night-border/50 hover:bg-gray-mist/20 dark:hover:bg-night-surface/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-night-text">{v.titulo}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-night-muted">{v.categoria}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-night-muted">{v.duracao ? `${v.duracao} min` : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          className="p-2 rounded-lg text-gray-600 dark:text-night-muted hover:bg-olive/15 hover:text-olive dark:hover:text-olive-light"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(v.id)}
                          className="p-2 rounded-lg text-gray-600 dark:text-night-muted hover:bg-red-500/15 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border shadow-xl p-6"
          >
            <h2 className="text-lg font-bold text-gray-800 dark:text-night-text mb-4">
              {editingId ? 'Editar vídeo' : 'Adicionar vídeo'}
            </h2>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  className="input-field"
                  placeholder="Ex: Como escovar os dentes"
                />
              </div>

              {/* Vídeo: URL ou arquivo */}
              <div className="rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-surface/50 p-4">
                <label className="block text-sm font-semibold text-gray-800 dark:text-night-text mb-3">Vídeo</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setVideoMode('url')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${videoMode === 'url' ? 'bg-olive text-white' : 'bg-white dark:bg-night-card border border-gray-200 dark:border-night-border text-gray-600 dark:text-night-muted hover:border-olive/50'}`}
                  >
                    <Link2 className="h-4 w-4" />
                    Por URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode('file')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${videoMode === 'file' ? 'bg-olive text-white' : 'bg-white dark:bg-night-card border border-gray-200 dark:border-night-border text-gray-600 dark:text-night-muted hover:border-olive/50'}`}
                  >
                    <FolderUp className="h-4 w-4" />
                    Arquivo (celular/PC)
                  </button>
                </div>
                {videoMode === 'url' ? (
                  <input
                    type="url"
                    required={videoMode === 'url'}
                    value={form.url}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    className="input-field w-full"
                    placeholder="https://exemplo.com/video.mp4 ou link do YouTube/Vimeo"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv"
                      onChange={handleVideoFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={uploadingVideo}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-night-border hover:border-olive/60 hover:bg-olive/5 dark:hover:bg-olive/10 transition-colors text-gray-600 dark:text-night-muted disabled:opacity-60"
                    >
                      <FolderUp className="h-5 w-5 shrink-0 text-olive" />
                      <span className="text-left flex-1">
                        {uploadingVideo ? 'Enviando…' : videoFileName ? videoFileName : 'Clique para escolher o vídeo (pasta do celular ou PC)'}
                      </span>
                    </button>
                    {form.url && videoMode === 'file' && (
                      <p className="text-xs text-green-600 dark:text-green-400">Vídeo anexado. Salve o formulário para confirmar.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Thumbnail: URL ou imagem */}
              <div className="rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-surface/50 p-4">
                <label className="block text-sm font-semibold text-gray-800 dark:text-night-text mb-3">Thumbnail (imagem de capa)</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setThumbnailMode('url')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${thumbnailMode === 'url' ? 'bg-olive text-white' : 'bg-white dark:bg-night-card border border-gray-200 dark:border-night-border text-gray-600 dark:text-night-muted hover:border-olive/50'}`}
                  >
                    <Link2 className="h-4 w-4" />
                    Por URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbnailMode('file')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${thumbnailMode === 'file' ? 'bg-olive text-white' : 'bg-white dark:bg-night-card border border-gray-200 dark:border-night-border text-gray-600 dark:text-night-muted hover:border-olive/50'}`}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Selecionar imagem (pasta)
                  </button>
                </div>
                {thumbnailMode === 'url' ? (
                  <input
                    type="url"
                    value={form.thumbnail}
                    onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
                    className="input-field w-full"
                    placeholder="https://exemplo.com/imagem.jpg (opcional)"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={thumbInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleThumbnailFile}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => thumbInputRef.current?.click()}
                      disabled={uploadingThumb}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-night-border hover:border-olive/60 hover:bg-olive/5 dark:hover:bg-olive/10 transition-colors text-gray-600 dark:text-night-muted disabled:opacity-60"
                    >
                      <ImagePlus className="h-5 w-5 shrink-0 text-olive" />
                      <span className="text-left flex-1">
                        {uploadingThumb ? 'Enviando…' : thumbFileName ? thumbFileName : 'Clique para escolher uma imagem (apenas imagens)'}
                      </span>
                    </button>
                    {form.thumbnail && thumbnailMode === 'file' && (
                      <div className="flex items-center gap-3 mt-2">
                        <img
                          src={
                            form.thumbnail.startsWith('http')
                              ? form.thumbnail
                              : `${typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : (typeof window !== 'undefined' ? window.location.origin : '')}${form.thumbnail}`
                          }
                          alt="Preview"
                          className="h-14 w-24 rounded-lg object-cover border border-gray-200 dark:border-night-border"
                        />
                        <p className="text-xs text-green-600 dark:text-green-400">Imagem anexada.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Categoria</label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  className="input-field"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Descrição (opcional)</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  className="input-field min-h-[80px]"
                  rows={2}
                  placeholder="Breve descrição do vídeo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-night-muted mb-1">Duração (min)</label>
                <input
                  type="number"
                  min={0}
                  value={form.duracao || ''}
                  onChange={(e) => setForm((f) => ({ ...f, duracao: parseInt(e.target.value, 10) || 0 }))}
                  className="input-field"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={!form.url}>
                  {editingId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

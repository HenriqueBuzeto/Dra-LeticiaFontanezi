'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageCircle, Phone, MapPin, Check, Sparkles, ArrowLeft } from 'lucide-react'
import { Carousel, CarouselCard } from '@/components/ui/Carousel'
import { DOCTOR_PROFILE, DEMO_REMINDER_TIP, DEMO_VIDEOS } from '@/data/demo'
import { Play } from 'lucide-react'
import { OrthodonticManual } from '@/components/orthodontic-manual/OrthodonticManual'

export default function Doctor() {
  const router = useRouter()
  const whatsappUrl = `https://wa.me/${DOCTOR_PROFILE.whatsapp.replace(/\D/g, '')}`
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DOCTOR_PROFILE.endereco)}`

  const scrollToManual = () => {
    const el = document.getElementById('manual-ortodontico')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="px-4 lg:px-0 py-6">
      {/* Botão Voltar */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-4"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-olive dark:hover:text-olive-light font-medium text-sm transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>
      </motion.div>

      <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Informações e cuidados</h1>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden border border-gray-mist/50 dark:border-night-border bg-gradient-to-r from-olive/10 via-white/60 to-accent-purple/10 shadow-soft p-5 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Manual do Paciente Ortodôntico</p>
            <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 leading-relaxed max-w-2xl">
              Guia completo com cuidados, alimentação, higiene, elásticos, dúvidas frequentes e escolha da cor das borrachinhas.
            </p>
          </div>
          <motion.button
            type="button"
            onClick={scrollToManual}
            className="btn-primary whitespace-nowrap"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Ver manual completo
          </motion.button>
        </div>
      </motion.section>

      {/* Lembrete da Dra */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-accent-purple/15 to-olive/15 border border-accent-purple/20 p-4 mb-6"
      >
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-accent-purple" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{DEMO_REMINDER_TIP.data}</p>
            <p className="text-gray-800 text-sm mt-0.5">{DEMO_REMINDER_TIP.mensagem}</p>
          </div>
        </div>
      </motion.div>

      {/* Carrossel: Vídeos introdutórios */}
      <Carousel title="Vídeos introdutórios" actionLabel="Ver todos" onAction={() => router.push('/videos')}>
        {DEMO_VIDEOS.slice(0, 3).map((v) => (
          <CarouselCard key={v.id}>
            <Link href="/videos" className="block rounded-2xl overflow-hidden bg-white shadow-soft border border-gray-mist/50">
              <div className="aspect-video relative">
                <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="h-6 w-6 text-olive ml-0.5" fill="currentColor" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded">
                  {v.duracao} min
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-800 line-clamp-2">{v.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{v.categoria}</p>
              </div>
            </Link>
          </CarouselCard>
        ))}
      </Carousel>

      {/* Sobre a dentista */}
      <section className="mt-8">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Sobre a dentista</h2>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white shadow-soft border border-gray-mist/50 overflow-hidden"
        >
          <div className="p-5">
            <div className="flex gap-4">
              {DOCTOR_PROFILE.foto ? (
                <img
                  src={DOCTOR_PROFILE.foto}
                  alt={DOCTOR_PROFILE.nome}
                  className="w-20 h-20 rounded-2xl object-cover shrink-0 border-2 border-gray-mist/50"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-olive/15 dark:bg-olive/25 border-2 border-olive/30 dark:border-olive/40 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-olive dark:text-olive-light">L</span>
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{DOCTOR_PROFILE.nome}</h3>
                <p className="text-sm font-medium text-olive">{DOCTOR_PROFILE.titulo}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4 leading-relaxed">{DOCTOR_PROFILE.bio}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {DOCTOR_PROFILE.especialidades.map((e) => (
                <span
                  key={e}
                  className="inline-flex items-center gap-1 text-xs font-medium text-olive bg-olive/10 px-2.5 py-1 rounded-lg"
                >
                  <Check className="h-3.5 w-3.5" />
                  {e}
                </span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-gray-mist/50">
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-4 text-green-600 hover:bg-green-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MessageCircle className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">WhatsApp</span>
            </motion.a>
            {DOCTOR_PROFILE.telefone ? (
              <motion.a
                href={`tel:${DOCTOR_PROFILE.telefone}`}
                className="flex flex-col items-center justify-center p-4 text-olive hover:bg-olive/5 transition-colors border-x border-gray-mist/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Phone className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">Ligar</span>
              </motion.a>
            ) : null}
            <motion.a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-4 text-gray-700 hover:bg-gray-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <MapPin className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Local</span>
            </motion.a>
          </div>
        </motion.div>
      </section>

      <section className="mt-10" id="manual-ortodontico">
        <OrthodonticManual whatsappUrl={whatsappUrl} schedulingHref="/doctor" />
      </section>
    </div>
  )
}

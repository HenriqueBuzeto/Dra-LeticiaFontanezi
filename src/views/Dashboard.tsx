'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bell, Calendar, Video, Scan, ChevronRight, Play, MessageCircle, Phone, MapPin, Sparkles, Info, Sun, Moon, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { api } from '@/lib/api'
import type { Appointment, Video as VideoType, AppointmentStatus } from '@/types'
import { Carousel, CarouselCard } from '@/components/ui/Carousel'
import { IMAGES, HERO_SLIDES, DEMO_VIDEOS, DOCTOR_PROFILE, CARE_APARELHO } from '@/data/demo'

const HeroCarousel = dynamic(
  () => import('@/components/ui/HeroCarousel').then((m) => ({ default: m.HeroCarousel })),
  { ssr: false, loading: () => <div className="rounded-2xl lg:rounded-3xl h-[160px] sm:h-[200px] lg:h-[380px] xl:h-[440px] bg-olive/10 dark:bg-olive/20 animate-pulse" /> }
)
import { CardSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toaster'

const DICA_DO_DIA = [
  'Escove os dentes pelo menos 2x ao dia e use fio dental antes de dormir.',
  'Evite alimentos muito açucarados entre as refeições para cuidar do aparelho.',
  'Em caso de dor ou ferida, entre em contato com a clínica pelo WhatsApp.',
]

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [nextAppointment, setNextAppointment] = useState<{
    id: string
    tipo: string
    data: string
    horario: string
    status: AppointmentStatus
    diasRestantes: number
    checkinStatus?: 'vai_comparecer' | 'nao_comparecer'
  } | null>(null)
  const [videos, setVideos] = useState<typeof DEMO_VIDEOS>(DEMO_VIDEOS)
  const [loading, setLoading] = useState(true)
  const [checkinModalOpen, setCheckinModalOpen] = useState(false)
  const [checkinSubmitting, setCheckinSubmitting] = useState(false)
  const { toast } = useToast()

  const loadAppointments = async () => {
    try {
      const appRes = await api.get<Appointment[]>('/appointments').then((r) => r.data)
      if (Array.isArray(appRes) && appRes.length > 0) {
        const next = appRes.find((a) => a.status === 'confirmado' || a.status === 'pendente') ?? appRes[0]
        const dataObj = new Date(next.data)
        const hoje = new Date()
        const diff = Math.ceil((dataObj.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        setNextAppointment({
          id: next.id,
          tipo: next.tipo ?? 'Consulta',
          data: next.data,
          horario: next.horario,
          status: next.status,
          diasRestantes: Math.max(0, diff),
          checkinStatus: (next as { checkinStatus?: 'vai_comparecer' | 'nao_comparecer' }).checkinStatus,
        })
      } else {
        setNextAppointment(null)
      }
    } catch {
      setNextAppointment(null)
    }
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [appRes, videosRes] = await Promise.all([
          api.get<Appointment[]>('/appointments').then((r) => r.data),
          api.get<VideoType[]>('/videos').then((r) => r.data),
        ])
        if (Array.isArray(appRes) && appRes.length > 0) {
          const next = appRes.find((a) => a.status === 'confirmado' || a.status === 'pendente') ?? appRes[0]
          const dataObj = new Date(next.data)
          const hoje = new Date()
          const diff = Math.ceil((dataObj.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
          setNextAppointment({
            id: next.id,
            tipo: next.tipo ?? 'Consulta',
            data: next.data,
            horario: next.horario,
            status: next.status,
            diasRestantes: Math.max(0, diff),
            checkinStatus: (next as { checkinStatus?: 'vai_comparecer' | 'nao_comparecer' }).checkinStatus,
          })
        } else {
          setNextAppointment(null)
        }
        if (Array.isArray(videosRes) && videosRes.length > 0) {
          setVideos(
            videosRes.slice(0, 4).map((v) => ({
              id: v.id,
              titulo: v.titulo,
              duracao: v.duracao ?? 0,
              categoria: v.categoria,
              thumbnail: v.thumbnail ?? IMAGES.videoBrush,
              url: v.url,
            }))
          )
        }
      } catch {
        setNextAppointment(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCheckin = async (status: 'vai_comparecer' | 'nao_comparecer') => {
    if (!nextAppointment?.id) return
    setCheckinSubmitting(true)
    try {
      await api.post(`/appointments/${nextAppointment.id}/checkin`, { status })
      setCheckinModalOpen(false)
      setNextAppointment((prev) => (prev ? { ...prev, checkinStatus: status } : null))
      toast(status === 'vai_comparecer' ? 'Check-in realizado! A doutora foi notificada.' : 'Registramos que você não poderá comparecer.', 'success')
      await loadAppointments()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast(msg ?? 'Não foi possível registrar o check-in. Tente novamente.', 'error')
    } finally {
      setCheckinSubmitting(false)
    }
  }

  const firstName = user?.nome?.split(' ')[0] ?? 'Paciente'
  const { theme, toggleTheme } = useTheme()
  const dicaIndex = new Date().getDate() % DICA_DO_DIA.length

  return (
    <div className="px-0 py-4 sm:py-6 lg:py-0">
      {/* Mobile: saudação – foto do perfil (ou iniciais), texto alinhado */}
      <header className="flex lg:hidden items-center justify-between mb-6 px-4">
        <div className="flex items-center gap-3 min-h-[44px]">
          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-olive/15 dark:bg-accent-purple/25 flex items-center justify-center text-olive dark:text-accent-purpleLight font-bold text-base shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              (user?.nome?.split(' ').map((n) => n[0]).join('').slice(0, 2) ?? 'P').toUpperCase()
            )}
          </div>
          <div className="flex flex-col justify-center gap-0.5">
            <h1 className="text-base font-bold text-gray-800 dark:text-night-text leading-tight">Bem-vindo,</h1>
            <h1 className="text-lg font-bold text-gray-800 dark:text-night-text leading-tight -mt-0.5">{firstName}</h1>
            <p className="text-xs text-gray-500 dark:text-night-muted leading-tight">Sua saúde bucal em um só lugar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button type="button" onClick={toggleTheme} className="p-2.5 rounded-2xl bg-white dark:bg-night-card shadow-soft border border-gray-mist/50 dark:border-night-border" title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
            {theme === 'dark' ? <Sun className="h-5 w-5 text-accent-purpleLight" /> : <Moon className="h-5 w-5 text-olive" />}
          </motion.button>
          <motion.button type="button" className="p-2.5 rounded-2xl bg-white dark:bg-night-card shadow-soft border border-gray-mist/50 dark:border-night-border">
            <Bell className="h-5 w-5 text-olive dark:text-accent-purpleLight" />
          </motion.button>
        </div>
      </header>

      {/* Hero / Carrossel – mobile: mesma largura que os cards (sem full-bleed); desktop: sem margem extra */}
      <section className="mb-4 lg:mb-10 lg:mx-0">
        <HeroCarousel
          slides={HERO_SLIDES}
          autoplayMs={5000}
          ctaLabel="Agendar consulta"
          ctaHref="/doctor"
        />
      </section>

      {/* Cuidados com o aparelho – seção em destaque no início */}
      <section className="mb-8 lg:mb-12 px-4 lg:px-0">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-2xl lg:rounded-3xl overflow-hidden bg-gradient-to-br from-olive/95 to-olive/80 dark:from-olive/90 dark:to-olive/70 shadow-soft"
        >
          <div className="absolute inset-0">
            <img
              src={CARE_APARELHO.heroImage}
              alt=""
              className="w-full h-full object-cover opacity-25 dark:opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
          </div>
          <div className="relative px-5 py-6 lg:px-10 lg:py-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl lg:text-2xl font-bold text-white drop-shadow-sm">
                {CARE_APARELHO.title}
              </h2>
            </div>
            <p className="text-white/95 text-sm lg:text-base max-w-2xl leading-relaxed">
              {CARE_APARELHO.subtitle}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5 mt-5 max-w-5xl mx-auto">
          {CARE_APARELHO.items.map((item, i) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 + i * 0.06 }}
              className="relative rounded-[22px] overflow-hidden bg-white dark:bg-night-card border-0 shadow-[0_24px_48px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.25)] hover:shadow-[0_32px_64px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_32px_64px_rgba(0,0,0,0.35)] transition-all duration-300 flex flex-col sm:min-h-[240px] sm:flex-row"
            >
              {/* Hero: área da imagem (~45%) */}
              <div className="relative w-full sm:min-w-[42%] sm:w-[42%] shrink-0 overflow-hidden rounded-t-[22px] sm:rounded-l-[22px] sm:rounded-tr-none sm:rounded-br-none pb-[58%] sm:pb-0">
                <img
                  src={item.image}
                  alt=""
                  className="absolute inset-0 size-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent sm:from-olive/10 sm:via-transparent sm:to-transparent" />
                <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-white/95 dark:bg-night-card/95 text-xs font-semibold text-gray-800 dark:text-night-text shadow-sm border border-gray-200/50 dark:border-white/10">
                  {item.iconLabel}
                </span>
              </div>
              {/* Conteúdo (~55%) */}
              <div className="relative z-[1] flex flex-1 flex-col justify-center gap-2.5 p-4 sm:p-5 sm:min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-night-text leading-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-night-muted leading-relaxed">
                  {item.description}
                </p>
                <ul className="flex flex-col gap-1.5 mt-0.5 list-none">
                  {item.tips.map((tip, j) => (
                    <li
                      key={j}
                      className="flex gap-2 text-xs text-gray-700 dark:text-night-text/90 leading-snug"
                    >
                      <span className="text-olive dark:text-accent-purpleLight shrink-0 mt-0.5 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Desktop: bloco dois textos (referência – “A clinic that provide…”) */}
      <section className="hidden lg:grid lg:grid-cols-2 lg:gap-10 lg:items-center lg:mb-12 lg:px-0">
        <h2 className="text-2xl xl:text-3xl font-bold text-gray-800 dark:text-night-text leading-tight">
          Uma clínica que cuida do seu sorriso com qualidade.
        </h2>
        <p className="text-gray-600 dark:text-night-text/80 leading-relaxed">
          Na Dra. Letícia Fontanezi você encontra ortodontia e odontologia com tecnologia de ponta e acompanhamento personalizado. Sua saúde bucal em um só lugar.
        </p>
      </section>

      {/* Mobile: Sobre a Dra. – card vertical com imagem + texto */}
      <section className="mb-6 px-4 lg:hidden">
        <div className="rounded-2xl overflow-hidden bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border shadow-soft dark:shadow-none">
          <div className="relative aspect-[4/3] bg-luxury-warmGray/30 dark:bg-gray-700/30">
            <img src={DOCTOR_PROFILE.heroImage} alt="Ambiente da clínica" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-4 right-4 text-xs font-semibold tracking-widest text-white/95 uppercase">Odontologia de excelência</span>
          </div>
          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-night-text mb-2">Sobre a Dra. Letícia</h2>
            <p className="text-sm text-gray-600 dark:text-night-text/80 leading-relaxed mb-4">{DOCTOR_PROFILE.bio}</p>
            <Link href="/doctor" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-olive text-white font-medium text-sm hover:opacity-95 transition-opacity min-h-[44px]">
              Conhecer e agendar
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Desktop: Sobre a Dra. – ambiente da clínica + texto */}
      <section className="hidden lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center lg:mb-14 lg:px-0">
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-luxury-warmGray/30 dark:bg-gray-700/30 shadow-lg ring-1 ring-black/5 dark:ring-white/5">
          <img src={DOCTOR_PROFILE.heroImage} alt="Ambiente da clínica" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-block text-xs font-semibold tracking-widest text-white/95 uppercase">Odontologia de excelência</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl xl:text-2xl font-bold text-gray-800 dark:text-night-text mb-3">Sobre a Dra. Letícia</h2>
          <p className="text-gray-600 dark:text-night-text/80 leading-relaxed mb-4">{DOCTOR_PROFILE.bio}</p>
          <Link href="/doctor" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-olive text-white font-medium text-sm hover:opacity-95 transition-opacity">
            Conhecer e agendar
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Informações para o paciente - card resumo */}
      <section className="mb-6 px-4 lg:px-0">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-night-muted uppercase tracking-wider mb-3 flex items-center gap-2 lg:text-olive/80 dark:lg:text-accent-purpleLight/90">
          <Info className="h-4 w-4" />
          Informações para você
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border p-4 shadow-soft dark:shadow-none transition-all duration-300 hover:shadow-glass hover:border-olive/20 dark:hover:border-accent-purple/40 lg:bg-white/70 dark:lg:bg-night-card lg:backdrop-blur-sm lg:border-luxury-warmGray/50 dark:lg:border-night-border"
        >
          <p className="text-sm text-gray-700 dark:text-night-text/90">
            Aqui você acompanha sua próxima consulta, acessa vídeos de cuidados e mantém seus lembretes em dia.
            Atualize seu <Link href="/profile" className="text-olive dark:text-accent-purpleLight font-medium underline underline-offset-2 hover:no-underline">perfil</Link> para receber lembretes personalizados.
          </p>
        </motion.div>
      </section>

      {/* Dica do dia */}
      <section className="mb-6 px-4 lg:px-0">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-2xl bg-olive/10 dark:bg-accent-purple/15 border border-olive/20 dark:border-accent-purple/30 p-4 flex gap-3 transition-all duration-300 hover:border-olive/40 dark:hover:border-accent-purple/40 hover:shadow-soft lg:bg-olive/5 dark:lg:bg-accent-purple/10 lg:border-olive/25 dark:lg:border-accent-purple/25 lg:backdrop-blur-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-olive/20 dark:bg-olive/30 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-olive dark:text-accent-purpleLight" />
          </div>
          <div>
            <p className="text-xs font-semibold text-olive dark:text-accent-purpleLight uppercase tracking-wide">Dica do dia</p>
            <p className="text-sm text-gray-800 dark:text-night-text/90 mt-0.5">{DICA_DO_DIA[dicaIndex]}</p>
          </div>
        </motion.div>
      </section>

      {/* Card de agenda – próxima visita */}
      <section className="mb-8 px-4 lg:px-0 w-full max-w-6xl">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-night-muted uppercase tracking-wider mb-3 lg:text-olive/80 dark:lg:text-accent-purpleLight/90">Sua próxima visita</h2>
        {loading ? (
          <CardSkeleton />
        ) : nextAppointment ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-olive shadow-soft"
              >
                <div className="absolute inset-0">
                  <img src={IMAGES.dentalChair} alt="" className="w-full h-full object-cover opacity-30" />
                  <div className="absolute inset-0 bg-gradient-to-r from-olive via-olive/95 to-olive/80" />
                </div>
                <div className="relative p-4 sm:p-5">
                  <span className="inline-block text-xs font-bold text-white/90 bg-white/20 px-2.5 py-1 rounded-lg mb-2">
                    EM {nextAppointment.diasRestantes} DIA{nextAppointment.diasRestantes !== 1 ? 'S' : ''}
                  </span>
                  <p className="text-white font-semibold text-lg">Próxima consulta</p>
                  <p className="text-white/90 text-sm mt-0.5">{nextAppointment.tipo}</p>
                  <p className="text-white/80 text-sm mt-1">
                    {new Date(nextAppointment.data).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    , {nextAppointment.horario}
                  </p>
                  {nextAppointment.checkinStatus ? (
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 text-white text-sm">
                      {nextAppointment.checkinStatus === 'vai_comparecer' ? (
                        <><CheckCircle2 className="h-4 w-4" /> Check-in realizado: você vai comparecer</>
                      ) : (
                        <><XCircle className="h-4 w-4" /> Check-in realizado: não vai comparecer</>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCheckinModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-olive font-medium text-sm hover:bg-gray-50 transition-colors"
                    >
                      Check-in antecipado
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
              {checkinModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !checkinSubmitting && setCheckinModalOpen(false)}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border shadow-xl p-6"
                  >
                    <h3 className="text-lg font-bold text-gray-800 dark:text-night-text mb-2">Check-in antecipado</h3>
                    <p className="text-sm text-gray-600 dark:text-night-muted mb-4">Você vai comparecer a esta consulta?</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={checkinSubmitting}
                        onClick={() => handleCheckin('vai_comparecer')}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-olive text-white font-medium text-sm hover:opacity-95 disabled:opacity-60"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Sim, vou comparecer
                      </button>
                      <button
                        type="button"
                        disabled={checkinSubmitting}
                        onClick={() => handleCheckin('nao_comparecer')}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-200 dark:bg-night-surface text-gray-700 dark:text-night-muted font-medium text-sm hover:bg-gray-300 dark:hover:bg-night-border disabled:opacity-60"
                      >
                        <XCircle className="h-5 w-5" />
                        Não poderei ir
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => !checkinSubmitting && setCheckinModalOpen(false)}
                      className="mt-3 w-full text-sm text-gray-500 dark:text-night-muted"
                    >
                      Cancelar
                    </button>
                  </motion.div>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group relative overflow-hidden rounded-3xl lg:rounded-[1.75rem] bg-white dark:bg-night-card border border-gray-mist/60 dark:border-night-border shadow-[0_12px_48px_rgba(0,0,0,0.06),0_0_0_1px_rgba(131,167,129,0.06)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.04)] hover:shadow-[0_24px_64px_rgba(131,167,129,0.12),0_0_0_1px_rgba(131,167,129,0.12)] dark:hover:shadow-[0_24px_64px_rgba(0,0,0,0.4),0_0_0_1px_rgba(131,167,129,0.15)] transition-shadow duration-500 lg:bg-gradient-to-br lg:from-white lg:via-offwhite/80 lg:to-olive/[0.04] dark:lg:from-night-card dark:lg:via-night-card dark:lg:to-olive/10 lg:backdrop-blur-sm"
            >
              {/* Decoração de luxo: borda superior sutil + formas */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl lg:rounded-[1.75rem]" aria-hidden>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-olive/30 to-transparent dark:via-olive/40" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-olive/[0.08] to-transparent dark:from-olive/15 rounded-bl-[12rem]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-olive/[0.05] to-transparent dark:from-olive/10 rounded-tr-[10rem]" />
                <div className="absolute top-1/2 right-8 w-2 h-2 rounded-full bg-olive/20 dark:bg-olive/30" />
                <div className="absolute bottom-12 left-12 w-1.5 h-1.5 rounded-full bg-olive/15 dark:bg-olive/25" />
              </div>

              <div className="relative p-5 sm:p-6 lg:py-5 lg:px-8 flex flex-col items-center text-center lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:text-left">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="w-16 h-16 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-olive/15 to-olive/8 dark:from-olive/25 dark:to-olive/15 flex items-center justify-center mb-4 lg:mb-0 shrink-0 shadow-inner border border-olive/10 dark:border-olive/20"
                >
                  <Calendar className="h-8 w-8 lg:h-7 lg:w-7 text-olive dark:text-accent-purpleLight" strokeWidth={1.8} />
                </motion.div>
                <div className="lg:flex-1 lg:min-w-0">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-base font-semibold text-gray-800 dark:text-night-text tracking-tight"
                  >
                    Nenhuma consulta agendada
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-gray-500 dark:text-night-muted text-sm mt-1 leading-relaxed"
                  >
                    Agende sua próxima visita com a Dra. Letícia e cuide do seu sorriso com quem entende.
                  </motion.p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="mt-5 lg:mt-0 shrink-0"
                >
                  <Link
                    href="/doctor"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-olive to-olive-dark dark:from-olive dark:to-olive-dark text-white font-semibold text-sm shadow-[0_8px_24px_rgba(131,167,129,0.35)] hover:shadow-[0_12px_32px_rgba(131,167,129,0.4)] hover:brightness-105 active:scale-[0.98] transition-all duration-300 border border-olive-dark/20 dark:border-olive/30"
                  >
                    Agendar com a Dra.
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </section>

      {/* Desktop: Nossos serviços – cards horizontais (referência) */}
      <section className="hidden lg:block mt-12 mb-10 px-0">
        <h2 className="text-xl xl:text-2xl font-bold text-gray-800 dark:text-night-text text-center mb-8">
          Nossos serviços
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { to: '/videos', icon: Video, label: 'Vídeos e dicas', desc: 'Cuidados e tutoriais' },
            { to: '/appointments', icon: Calendar, label: 'Agenda', desc: 'Agende sua consulta' },
            { to: '/ar-simulator', icon: Scan, label: 'Simulador AR', desc: 'Cores e clareamento' },
          ].map((item, i) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
            >
              <Link
                href={item.to ?? '#'}
                className="block rounded-2xl bg-white dark:bg-night-card border border-luxury-warmGray/40 dark:border-night-border p-6 shadow-[0_4px_20px_rgba(0,78,100,0.06)] dark:shadow-none hover:shadow-glass hover:border-olive/30 dark:hover:border-accent-purple/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-olive/10 dark:bg-accent-purple/20 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-olive dark:text-accent-purpleLight" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-night-text">{item.label}</h3>
                <p className="text-sm text-gray-500 dark:text-night-muted mt-1">{item.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contato rápido - Dra. Letícia */}
      <section className="mt-8 px-4 lg:px-0">
        <h2 className="text-xs font-semibold text-gray-500 dark:text-night-muted uppercase tracking-wider mb-3 lg:text-olive/80 dark:lg:text-accent-purpleLight/90">Contato rápido</h2>
        <div className="rounded-2xl bg-white dark:bg-night-card border border-gray-mist/50 dark:border-night-border p-4 flex flex-wrap gap-3 shadow-soft dark:shadow-none transition-shadow hover:shadow-glass lg:bg-white/70 dark:lg:bg-night-card lg:backdrop-blur-sm lg:border-luxury-warmGray/50 dark:lg:border-night-border">
          <motion.a
            href={`https://wa.me/${DOCTOR_PROFILE.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/30 hover:bg-green-500/25 dark:hover:bg-green-500/20 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </motion.a>
          {DOCTOR_PROFILE.telefone ? (
            <motion.a
              href={`tel:${DOCTOR_PROFILE.telefone}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-olive/15 dark:bg-olive/25 text-olive dark:text-olive-light border border-olive/30 hover:bg-olive/20 dark:hover:bg-olive/30 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Phone className="h-5 w-5" />
              Ligar
            </motion.a>
          ) : null}
          <motion.a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DOCTOR_PROFILE.endereco)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200/80 dark:hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MapPin className="h-5 w-5" />
            Localização
          </motion.a>
        </div>
      </section>

      {/* Carrossel: Dicas e vídeos de cuidados */}
      <section className="mt-8 lg:mt-10 px-4 lg:px-0">
        <Carousel title="Dicas e vídeos de cuidados" actionLabel="Ver todos" onAction={() => router.push('/videos')}>
          {videos.map((v) => (
            <CarouselCard key={v.id}>
              <Link href="/videos" className="block rounded-2xl overflow-hidden bg-white dark:bg-night-card shadow-soft border border-gray-mist/50 dark:border-night-border lg:bg-white/70 dark:lg:bg-night-card lg:border-luxury-warmGray/50 dark:lg:border-night-border">
                <div className="aspect-video relative">
                  <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="h-6 w-6 text-olive ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 text-xs font-medium text-white bg-black/50 px-2 py-0.5 rounded">
                    {v.duracao} min
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-night-text/90 line-clamp-2">{v.titulo}</p>
                  <p className="text-xs text-gray-500 dark:text-night-muted mt-0.5">{v.categoria}</p>
                </div>
              </Link>
            </CarouselCard>
          ))}
        </Carousel>
      </section>
    </div>
  )
}

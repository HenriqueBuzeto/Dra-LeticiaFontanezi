'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageCircle, Phone, MapPin, Instagram, ExternalLink } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { DOCTOR_PROFILE } from '@/data/demo'
import { ENABLE_AR_SIMULATOR, AR_ROUTE_PATH, AR_NAV_LABEL } from '@/features/ar/config'

const WHATSAPP_URL = `https://wa.me/${DOCTOR_PROFILE.whatsapp.replace(/\D/g, '')}`
const INSTAGRAM_URL = DOCTOR_PROFILE.instagram ?? 'https://instagram.com'
const HB_STUDIO_URL = 'https://www.hbstudiodev.com'

const navItems = [
  { to: '/dashboard', label: 'Início' },
  { to: '/appointments', label: 'Agenda' },
  { to: '/videos', label: 'Vídeos' },
  ...(ENABLE_AR_SIMULATOR ? [{ to: AR_ROUTE_PATH, label: AR_NAV_LABEL }] : []),
  { to: '/reminders', label: 'Lembretes' },
  { to: '/pontos', label: 'Pontos' },
  { to: '/profile', label: 'Perfil' },
  { to: '/doctor', label: 'Contato' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function Footer() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <footer
      data-theme={theme}
      className={`relative mt-auto overflow-hidden rounded-2xl lg:rounded-3xl border backdrop-blur-xl transition-colors duration-300
        ${isDark
          ? 'border-night-border bg-night-surface shadow-[0_-4px_40px_-8px_rgba(0,0,0,0.5)]'
          : 'border-gray-200/80 bg-[#f8f6f3] shadow-[0_-4px_40px_-8px_rgba(0,78,100,0.08),0_0_0_1px_rgba(0,0,0,0.04)_inset'
        }`}
    >
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-olive/40 to-transparent pointer-events-none dark:via-olive/50`} aria-hidden="true" />
      <div className={`absolute inset-x-0 bottom-0 h-12 lg:h-24 pointer-events-none ${isDark ? 'bg-gradient-to-t from-accent-purple/15 to-transparent' : 'bg-gradient-to-t from-olive/8 to-transparent'}`} aria-hidden="true" />

      <div className="relative w-full px-4 sm:px-5 lg:px-8 py-5 sm:py-6 lg:py-8">
        {/* Grid: mobile 2 colunas (marca | nav+contato), desktop 3 colunas */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-8 items-start text-left"
        >
          {/* Coluna 1: Marca */}
          <div className="flex flex-col col-span-2 lg:col-span-1">
            <motion.div
              variants={item}
              className="flex items-center gap-3 sm:gap-4 mb-2 lg:mb-3"
            >
              <img
                src="/Logo.png"
                alt=""
                className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-lg lg:rounded-xl object-contain shrink-0"
              />
              <span className={`font-bold text-base sm:text-lg lg:text-xl tracking-tight leading-tight ${isDark ? 'text-night-text' : 'text-gray-800'}`}>
                Dra. Letícia Fontanezi
              </span>
            </motion.div>
            <motion.p variants={item} className={`text-[11px] sm:text-xs leading-snug ${isDark ? 'text-night-muted' : 'text-gray-600'}`}>
              Especialista em ortodontia. Sua saúde bucal e sorriso em primeiro lugar.
            </motion.p>
          </div>

          {/* Coluna 2: Navegação */}
          <div className="flex flex-col min-w-0">
            <motion.h3
              variants={item}
              className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 lg:mb-2 lg:min-h-[2.5rem] lg:flex lg:items-end ${isDark ? 'text-night-muted' : 'text-gray-500'}`}
            >
              Navegação
            </motion.h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 sm:gap-y-1 text-[11px] sm:text-xs">
              {navItems.map(({ to, label }) => (
                <li key={to ?? label}>
                  <Link
                    href={to ?? '#'}
                    className={`transition-colors hover:text-olive dark:hover:text-olive-light ${isDark ? 'text-night-muted hover:text-accent-purpleLight' : 'text-gray-600 hover:text-olive'}`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna 3: Contato */}
          <div className="flex flex-col min-w-0">
            <motion.h3
              variants={item}
              className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 lg:mb-2 lg:min-h-[2.5rem] lg:flex lg:items-end ${isDark ? 'text-night-muted' : 'text-gray-500'}`}
            >
              Contato
            </motion.h3>
            <ul className={`space-y-1 text-[11px] sm:text-xs ${isDark ? 'text-night-muted' : 'text-gray-600'}`}>
              <li className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5 shrink-0 text-green-600/80" />
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 transition-colors">WhatsApp</a>
              </li>
              {DOCTOR_PROFILE.telefone ? (
                <li className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-olive/80 dark:text-olive-light/80" />
                  <a href={`tel:${DOCTOR_PROFILE.telefone}`} className="hover:text-olive transition-colors">{DOCTOR_PROFILE.telefone}</a>
                </li>
              ) : null}
              <li className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-olive/80 dark:text-olive-light/80" />
                <span>{DOCTOR_PROFILE.endereco}</span>
              </li>
            </ul>
          </div>
        </motion.div>

        {/* Linha inferior: redes, copyright e desenvolvedor */}
        <div className="mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-gray-200/70 dark:border-gray-700/50">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div className="flex items-center gap-1.5">
                <motion.a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/15 transition-colors" aria-label="WhatsApp">
                  <MessageCircle className="h-3.5 w-3.5" />
                </motion.a>
                <motion.a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600 hover:bg-pink-500/15 transition-colors" aria-label="Instagram">
                  <Instagram className="h-3.5 w-3.5" />
                </motion.a>
              </div>
              <p className={`text-[10px] sm:text-[11px] ${isDark ? 'text-night-muted' : 'text-gray-400'}`}>
                © {new Date().getFullYear()} Dra. Letícia Fontanezi
              </p>
            </div>
            <p className={`text-[10px] sm:text-xs ${isDark ? 'text-night-muted' : 'text-gray-500'}`}>
              Desenvolvido por{' '}
              <motion.a href={HB_STUDIO_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-olive dark:text-olive-light hover:underline inline-flex items-center gap-0.5">
                HB Studio Dev <ExternalLink className="h-2.5 w-2.5 opacity-70" />
              </motion.a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

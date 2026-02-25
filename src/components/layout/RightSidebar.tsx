import Link from 'next/link'
import { MessageCircle, Phone, Calendar, Video, User, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { DOCTOR_PROFILE } from '@/data/demo'

export default function RightSidebar() {
  return (
    <aside
      className="hidden xl:flex xl:flex-col xl:w-80 xl:shrink-0 xl:py-6 xl:pr-6 xl:pl-2 gap-6"
      aria-label="Acesso rápido e contato"
    >
      {/* Contato rápido */}
      <motion.section
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl bg-luxury-cream/80 dark:bg-luxury-slate/80 backdrop-blur-xl border border-luxury-warmGray/40 dark:border-gray-600/40 p-4 shadow-[0_4px_20px_rgba(0,78,100,0.06)] dark:shadow-none"
      >
        <h3 className="text-xs font-semibold text-olive/90 dark:text-olive-light/90 uppercase tracking-wider mb-3">
          Fale com a Dra.
        </h3>
        <div className="space-y-2">
          <a
            href={`https://wa.me/${DOCTOR_PROFILE.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 dark:bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/20 dark:border-green-500/30 hover:bg-green-500/15 dark:hover:bg-green-500/20 transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-green-500/20 dark:bg-green-500/25 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">WhatsApp</span>
          </a>
          {DOCTOR_PROFILE.telefone ? (
            <a
              href={`tel:${DOCTOR_PROFILE.telefone}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-olive/10 dark:bg-olive/20 text-olive dark:text-olive-light border border-olive/20 dark:border-olive/30 hover:bg-olive/15 dark:hover:bg-olive/25 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-olive/20 dark:bg-olive/25 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Phone className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium">Ligar</span>
            </a>
          ) : null}
        </div>
      </motion.section>

      {/* Atalhos */}
      <motion.section
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="rounded-2xl bg-luxury-cream/80 dark:bg-luxury-slate/80 backdrop-blur-xl border border-luxury-warmGray/40 dark:border-gray-600/40 p-4 shadow-[0_4px_20px_rgba(0,78,100,0.06)] dark:shadow-none"
      >
        <h3 className="text-xs font-semibold text-olive/90 dark:text-olive-light/90 uppercase tracking-wider mb-3">
          Acesso rápido
        </h3>
        <nav className="space-y-1">
          {[
            { to: '/appointments', icon: Calendar, label: 'Agenda' },
            { to: '/videos', icon: Video, label: 'Vídeos e dicas' },
            { to: '/profile', icon: User, label: 'Meu perfil' },
          ].map(({ to, icon: Icon, label }) => (
            <Link
              key={to ?? label}
              href={to ?? '#'}
              className="flex items-center gap-3 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-olive/10 dark:hover:bg-olive/15 hover:text-olive dark:hover:text-olive-light border border-transparent hover:border-olive/20 dark:hover:border-olive/30 transition-all"
            >
              <Icon className="h-5 w-5 text-olive/80 dark:text-olive-light/80" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>
      </motion.section>

      {/* Frase / identidade */}
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-2xl bg-gradient-to-br from-olive/10 to-olive/5 dark:from-olive/20 dark:to-olive/10 border border-olive/20 dark:border-olive/30 p-4 flex items-start gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-olive/20 dark:bg-olive/30 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-olive dark:text-olive-light" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          Sua saúde bucal com acompanhamento personalizado e tecnologia de ponta.
        </p>
      </motion.div>
    </aside>
  )
}

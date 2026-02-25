'use client'

/** Placeholder mostrado até o ParticlesBackground carregar — evita bloqueio na primeira pintura */
export default function ParticlesBackgroundPlaceholder() {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 transition-colors duration-500
          bg-gradient-to-br from-offwhite via-offwhite/95 to-olive/5
          dark:from-night-bg dark:via-[#1E1F18] dark:to-olive-dark/20"
      />
    </div>
  )
}

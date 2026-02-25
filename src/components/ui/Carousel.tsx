import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface CarouselProps {
  children: React.ReactNode
  title?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function Carousel({ children, title, actionLabel, onAction, className = '' }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const width = scrollRef.current.clientWidth
    scrollRef.current.scrollBy({ left: dir === 'left' ? -width : width, behavior: 'smooth' })
  }

  return (
    <section className={className}>
      {(title || actionLabel) && (
        <div className="flex items-center justify-between mb-3">
          {title && <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h2>}
          {actionLabel && onAction && (
            <button type="button" onClick={onAction} className="text-sm font-medium text-olive hover:underline">
              {actionLabel}
            </button>
          )}
        </div>
      )}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-1 px-1 hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {children}
        </div>
        <button
          type="button"
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 rounded-full bg-white/90 shadow-soft hidden sm:flex items-center justify-center text-olive z-10"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 rounded-full bg-white/90 shadow-soft hidden sm:flex items-center justify-center text-olive z-10"
          aria-label="Próximo"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  )
}

interface CarouselCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function CarouselCard({ children, className = '', onClick }: CarouselCardProps) {
  return (
    <motion.div
      className={`shrink-0 w-[85vw] sm:w-64 lg:w-72 snap-center ${className}`}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}

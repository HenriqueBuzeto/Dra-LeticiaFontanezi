import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Antes',
  afterLabel = 'Depois',
  className = '',
}: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const updatePosition = useCallback(
    (clientX: number) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = clientX - rect.left
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100))
      setPosition(pct)
    },
    []
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      isDragging.current = true
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      updatePosition(e.clientX)
    },
    [updatePosition]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return
      updatePosition(e.clientX)
    },
    [updatePosition]
  )

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }, [])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border-2 border-olive/20 dark:border-olive/30 bg-olive/5 dark:bg-olive/10 shadow-soft ${className}`}
    >
      <div className="relative aspect-[4/3] sm:aspect-[16/10] min-h-[220px] select-none">
        {/* Camada "Antes" (fundo) - imagem com tom amarelado */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${beforeImage})`,
            filter: 'sepia(0.35) saturate(1.1) hue-rotate(-5deg)',
          }}
          aria-hidden
        />
        {/* Camada "Depois" (recortada pela posição do slider) */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${afterImage})`,
            clipPath: `inset(0 ${100 - position}% 0 0)`,
          }}
          aria-hidden
        />
        {/* Linha + handle arrastável */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          <motion.div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white border-2 border-olive/30 shadow-lg cursor-ew-resize flex items-center justify-center touch-none"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronLeft className="h-4 w-4 text-olive absolute left-1" strokeWidth={2.5} />
            <ChevronRight className="h-4 w-4 text-olive absolute right-1" strokeWidth={2.5} />
          </motion.div>
        </div>
        {/* Labels opcionais */}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/50 text-white text-xs font-medium">
          {beforeLabel}
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/50 text-white text-xs font-medium">
          {afterLabel}
        </div>
      </div>
    </motion.div>
  )
}

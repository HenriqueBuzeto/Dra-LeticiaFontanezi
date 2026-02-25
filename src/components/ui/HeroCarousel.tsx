import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useKeenSlider } from 'keen-slider/react'
import { motion } from 'framer-motion'
import { CalendarPlus } from 'lucide-react'
import 'keen-slider/keen-slider.min.css'

export type HeroSlide = {
  id: string
  image: string
  title?: string
  subtitle?: string
}

interface HeroCarouselProps {
  slides: HeroSlide[]
  autoplayMs?: number
  className?: string
  ctaLabel?: string
  ctaHref?: string
}

export function HeroCarousel({
  slides,
  autoplayMs = 5000,
  className = '',
  ctaLabel,
  ctaHref = '/doctor',
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      mode: 'snap',
      slides: { perView: 1, spacing: 0 },
      defaultAnimation: { duration: 600 },
      slideChanged(slider) {
        setCurrentIndex(slider.track.details.rel)
      },
    },
    []
  )

  useEffect(() => {
    if (!autoplayMs || !instanceRef.current) return
    const t = setInterval(() => {
      instanceRef.current?.next()
    }, autoplayMs)
    return () => clearInterval(t)
  }, [autoplayMs, instanceRef])

  if (!slides.length) return null

  const currentSlide = slides[currentIndex] ?? slides[0]

  return (
    <section className={`relative overflow-hidden rounded-2xl lg:rounded-3xl ${className}`}>
      <div
        ref={sliderRef}
        className="keen-slider h-[160px] sm:h-[200px] lg:h-[380px] xl:h-[440px]"
      >
        {slides.map((slide) => (
          <div key={slide.id} className="keen-slider__slide min-w-full">
            <div className="relative w-full h-full">
              <img
                src={slide.image}
                alt={slide.title ?? ''}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/80 via-black/40 to-transparent lg:from-black/70 lg:via-black/30 lg:to-transparent" />
              {/* Mobile: texto no rodapé */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 lg:hidden">
                {slide.title && (
                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg sm:text-xl font-bold text-white drop-shadow-md"
                  >
                    {slide.title}
                  </motion.h2>
                )}
                {slide.subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-white/90 mt-0.5 drop-shadow"
                  >
                    {slide.subtitle}
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: overlay com título + CTA à esquerda e avaliação à direita */}
      <div className="absolute inset-0 pointer-events-none hidden lg:flex items-center p-8 xl:p-12">
        <div className="flex-1 flex flex-col justify-center max-w-xl">
          <motion.h2
            key={`title-${currentIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl xl:text-3xl font-bold text-white drop-shadow-md leading-tight"
          >
            {currentSlide?.title ?? 'Cuidando do seu sorriso'}
          </motion.h2>
          {currentSlide?.subtitle && (
            <motion.p
              key={`sub-${currentIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/90 mt-2 xl:mt-3 text-base xl:text-lg max-w-md"
            >
              {currentSlide.subtitle}
            </motion.p>
          )}
          {ctaLabel && (
            <div className="mt-4 xl:mt-6 pointer-events-auto">
              <Link
                href={ctaHref ?? '/doctor'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-olive text-white font-medium text-sm xl:text-base shadow-lg hover:opacity-95 active:scale-[0.98] transition-all"
              >
                <CalendarPlus className="h-5 w-5" />
                {ctaLabel}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => instanceRef.current?.moveToIdx(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

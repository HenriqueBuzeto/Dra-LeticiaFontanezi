'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { useTheme } from '@/contexts/ThemeContext'

/** Número reduzido de partículas para melhor performance (especialmente mobile) */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const m = window.matchMedia('(max-width: 768px)')
    setReduced(m.matches)
    const fn = () => setReduced(m.matches)
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [])
  return reduced
}

export default function ParticlesBackground() {
  const { theme } = useTheme()
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const initStarted = useRef(false)
  const isDark = theme === 'dark'
  const isMobile = useReducedMotion()

  useEffect(() => {
    if (initStarted.current) return
    initStarted.current = true

    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 300)

    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    })
      .then(() => {
        if (!cancelled) {
          clearTimeout(timeout)
          setReady(true)
          setFailed(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          clearTimeout(timeout)
          setReady(true)
          setFailed(true)
          console.warn('[Particles] Engine failed to load, showing gradient only.', err)
        }
      })

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  const options = useMemo(
    () => ({
      fullScreen: false,
      detectRetina: false,
      fpsLimit: isMobile ? 24 : 30,
      particles: {
        number: {
          value: isMobile ? 35 : 65,
          density: { enable: false },
        },
        color: {
          value: isDark
            ? ['#8fa98d', '#8A8B7A', '#9bb999']
            : ['#83a781', '#9bb999', '#8fa98d', '#FEFBF6'],
        },
        opacity: {
          value: { min: 0.25, max: 0.55 },
          animation: { enable: !isMobile, speed: 0.4, sync: false },
        },
        size: { value: { min: 1.2, max: 2.5 } },
        move: {
          enable: true,
          speed: { min: 0.15, max: 0.5 },
          direction: 'none' as const,
          random: true,
          outModes: { default: 'out' as const },
        },
        links: {
          enable: !isMobile,
          distance: 120,
          color: isDark ? 'rgba(131,167,129,0.3)' : 'rgba(131,167,129,0.25)',
          opacity: 0.3,
          width: 1,
        },
      },
      interactivity: {
        detectsOn: 'window' as const,
        events: {
          onHover: { enable: !isMobile, mode: 'grab' as const },
        },
        modes: {
          grab: {
            distance: 120,
            links: { opacity: 0.4, color: isDark ? '#8A8B7A' : '#83a781' },
          },
        },
      },
      background: { color: 'transparent' },
    }),
    [isDark, isMobile]
  )

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="absolute inset-0 transition-colors duration-500
          bg-gradient-to-br from-offwhite via-offwhite/95 to-olive/5
          dark:from-night-bg dark:via-[#1E1F18] dark:to-olive-dark/20"
      />
      {ready && !failed && (
        <Particles
          key={isDark ? 'dark' : 'light'}
          id="global-particles"
          className="absolute inset-0 w-full h-full z-[1]"
          options={options}
        />
      )}
    </div>
  )
}

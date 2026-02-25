import { useRef, useState, useCallback, useEffect } from 'react'
import { ElasticColorSelector } from './ElasticColorSelector'
import { useElasticAR } from '../hooks/useElasticAR'
import type { ManualElasticPoints } from '../types'

export function ElasticAROverlay() {
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    videoRef,
    canvasRef,
    error,
    loading,
    started,
    selectedColor,
    setSelectedColor,
    startCamera,
    stopCamera,
    isManualMode,
    setManualMode,
    manualPoints,
    setManualPoints,
    saveManualPoints,
    modelLoaded,
  } = useElasticAR({ blendMode: 'overlay' })

  const [dragging, setDragging] = useState<'center' | 'radius' | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0, points: { centerX: 0, centerY: 0, radiusX: 0, radiusY: 0 } })

  const defaultPoints: ManualElasticPoints = {
    centerX: 0.5,
    centerY: 0.55,
    radiusX: 0.12,
    radiusY: 0.08,
  }
  const points = manualPoints ?? defaultPoints

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, kind: 'center' | 'radius') => {
      e.preventDefault()
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      setDragging(kind)
      dragStartRef.current = {
        x,
        y,
        points: { ...points },
      }
    },
    [points]
  )

  useEffect(() => {
    if (dragging === null) return
    const onMove = (e: PointerEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      const { x: x0, y: y0, points: p0 } = dragStartRef.current
      if (dragging === 'center') {
        setManualPoints({
          ...p0,
          centerX: p0.centerX + (x - x0),
          centerY: p0.centerY + (y - y0),
        })
        dragStartRef.current = { x, y, points: { ...p0, centerX: p0.centerX + (x - x0), centerY: p0.centerY + (y - y0) } }
      } else {
        const dx = x - p0.centerX
        const dy = y - p0.centerY
        setManualPoints({
          ...p0,
          radiusX: Math.max(0.02, Math.abs(dx)),
          radiusY: Math.max(0.02, Math.abs(dy)),
        })
      }
    }
    const onUp = () => setDragging(null)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, setManualPoints])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={started ? stopCamera : startCamera}
          className="px-4 py-2 rounded-xl bg-olive text-white font-medium hover:opacity-90"
        >
          {started ? 'Parar câmera' : 'Iniciar câmera'}
        </button>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isManualMode}
            onChange={(e) => setManualMode(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm">Modo ajuste manual</span>
        </label>
        {isManualMode && (
          <button
            type="button"
            onClick={saveManualPoints}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-night-border text-sm"
          >
            Salvar posição
          </button>
        )}
        {modelLoaded && <span className="text-xs text-green-600 dark:text-green-400">Modelo TF carregado</span>}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="relative inline-block overflow-hidden rounded-2xl bg-black max-w-full" ref={containerRef}>
        <video
          ref={videoRef as React.RefObject<HTMLVideoElement>}
          playsInline
          muted
          className="block w-full max-h-[60vh] object-cover"
          style={{ display: started ? 'block' : 'none' }}
        />
        <canvas
          ref={canvasRef as React.RefObject<HTMLCanvasElement>}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ display: started ? 'block' : 'none' }}
        />
        {started && !isManualMode && (
          <p className="absolute bottom-2 left-2 text-white/80 text-xs drop-shadow">
            Posicione o rosto e a boca no quadro
          </p>
        )}
        {started && isManualMode && (
          <>
            <div
              className="absolute border-2 border-white border-dashed rounded-full pointer-events-none"
              style={{
                left: `${(points.centerX - points.radiusX) * 100}%`,
                top: `${(points.centerY - points.radiusY) * 100}%`,
                width: `${points.radiusX * 2 * 100}%`,
                height: `${points.radiusY * 2 * 100}%`,
              }}
            />
            <div
              className="absolute w-6 h-6 -ml-3 -mt-3 cursor-move rounded-full bg-white/90 border-2 border-olive pointer-events-auto"
              style={{ left: `${points.centerX * 100}%`, top: `${points.centerY * 100}%` }}
              onPointerDown={(e) => handlePointerDown(e, 'center')}
              title="Arrastar centro"
            />
            <div
              className="absolute w-4 h-4 -ml-2 -mt-2 cursor-nwse-resize rounded-full bg-olive/80 pointer-events-auto"
              style={{
                left: `${(points.centerX + points.radiusX) * 100}%`,
                top: `${(points.centerY + points.radiusY) * 100}%`,
              }}
              onPointerDown={(e) => handlePointerDown(e, 'radius')}
              title="Ajustar tamanho"
            />
          </>
        )}
        {!started && (
          <div className="flex items-center justify-center w-full min-h-[240px] text-gray-500 dark:text-night-muted">
            {loading ? 'Carregando...' : 'Clique em "Iniciar câmera"'}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-night-text mb-2">Cor da borrachinha</p>
        <ElasticColorSelector value={selectedColor} onChange={setSelectedColor} />
      </div>
    </div>
  )
}

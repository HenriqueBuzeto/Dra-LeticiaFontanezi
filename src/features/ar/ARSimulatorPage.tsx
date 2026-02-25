import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Camera, HelpCircle, Loader2, AlertCircle, Scan, Smile } from 'lucide-react'
import { useToast } from '@/components/ui/Toaster'
import { ELASTIC_COLOR_CATEGORIES, DEFAULT_ELASTIC_COLOR } from './constants'
import {
  loadFaceModels,
  loadBracesAssets,
  detectFaceLandmarks,
  drawBracesOverlay,
  getMouthBBoxFromLandmarks,
  applyElasticRecolor,
} from './arBraces'

type ARMode = 'simulate' | 'has_braces'
type LandmarksOrNull = Awaited<ReturnType<typeof detectFaceLandmarks>>
const DETECT_EVERY_N = 2

export default function ARSimulatorPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const [selectedColor, setSelectedColor] = useState(DEFAULT_ELASTIC_COLOR)
  const [mode, setMode] = useState<ARMode>('has_braces')
  const [modelsReady, setModelsReady] = useState<boolean | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const animationRef = useRef<number>(0)
  const lastLandmarksRef = useRef<LandmarksOrNull>(null)
  const frameCountRef = useRef(0)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    Promise.all([loadFaceModels(), loadBracesAssets()]).then(([ok]) => {
      if (!cancelled) setModelsReady(ok)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let s: MediaStream | null = null
    const startCamera = async () => {
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        })
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
          await videoRef.current.play()
        }
      } catch {
        toast('Não foi possível acessar a câmera. Verifique as permissões.', 'error')
      }
    }
    startCamera()
    return () => {
      s?.getTracks().forEach((t) => t.stop())
      setStream(null)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [toast])

  const runLoop = useCallback(() => {
    const video = videoRef.current
    const overlay = overlayRef.current
    const workCanvas = canvasRef.current
    animationRef.current = requestAnimationFrame(runLoop)

    if (!video || !overlay) return
    const w = video.videoWidth
    const h = video.videoHeight
    if (w <= 0 || h <= 0 || video.readyState < 2) return

    const ctx = overlay.getContext('2d')
    if (!ctx) return

    overlay.width = w
    overlay.height = h
    ctx.clearRect(0, 0, w, h)

    frameCountRef.current += 1
    const doDetect = frameCountRef.current % DETECT_EVERY_N === 0
    if (modelsReady && doDetect) {
      detectFaceLandmarks(video).then((landmarks) => {
        if (landmarks) lastLandmarksRef.current = landmarks
      })
    }

    const landmarks = lastLandmarksRef.current
    if (!landmarks) return

    if (mode === 'simulate') {
      drawBracesOverlay(ctx, landmarks, selectedColor, w, h)
      return
    }

    if (mode === 'has_braces') {
      const mouthBBox = getMouthBBoxFromLandmarks(landmarks, w, h)
      if (!workCanvas || !mouthBBox) return
      workCanvas.width = w
      workCanvas.height = h
      const workCtx = workCanvas.getContext('2d')
      if (!workCtx) return
      workCtx.drawImage(video, 0, 0, w, h)
      let imageData: ImageData
      try {
        imageData = workCtx.getImageData(0, 0, w, h)
      } catch {
        return
      }
      const recolor = applyElasticRecolor(imageData, mouthBBox, selectedColor)
      ctx.putImageData(recolor, 0, 0)
    }
  }, [modelsReady, mode, selectedColor])

  useEffect(() => {
    runLoop()
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [runLoop])

  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color)
  }, [])

  const handleModeChange = useCallback((m: ARMode) => {
    setMode(m)
  }, [])

  const handleSaveImage = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas || !video || !overlay) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -video.videoWidth, 0, video.videoWidth, video.videoHeight)
    if (modelsReady && overlay.width === video.videoWidth) {
      ctx.drawImage(overlay, -video.videoWidth, 0, video.videoWidth, video.videoHeight)
    }
    ctx.restore()

    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    const colorSlug = selectedColor.replace('#', '') || 'transparente'
    a.download = `aparelho-ligaduras-${colorSlug}.png`
    a.click()
    toast('Imagem salva!', 'success')
  }

  return (
    <div className="px-4 lg:px-0 py-6 flex flex-col min-h-[calc(100vh-6rem)]">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-night-text">
          Simulador de aparelho
        </h1>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-2xl bg-white dark:bg-night-card shadow-soft border border-gray-200 dark:border-night-border"
          title="Tenho aparelho: troca a cor das borrachinhas na câmera. Simular: desenha um aparelho na boca. Use face-api.js (68 pontos)."
        >
          <HelpCircle className="h-5 w-5 text-olive dark:text-olive-light" />
        </motion.button>
      </header>

      {modelsReady === false && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">Detecção facial não carregada</p>
            <p className="mt-0.5">
              Os modelos (face-api.js) são baixados do jsDelivr. Verifique a conexão e recarregue. Se o firewall bloquear, coloque os pesos em <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">public/models</code> — veja o README nessa pasta.
            </p>
          </div>
        </div>
      )}

      {modelsReady === null && (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-olive/10 dark:bg-olive/20 border border-olive/20 p-4">
          <Loader2 className="h-5 w-5 text-olive dark:text-olive-light animate-spin shrink-0" />
          <span className="text-sm text-gray-700 dark:text-night-muted">
            Carregando detecção facial (face-api.js)...
          </span>
        </div>
      )}

      <div className="mb-4 flex rounded-xl bg-gray-100 dark:bg-night-surface p-1">
        <button
          type="button"
          onClick={() => handleModeChange('has_braces')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === 'has_braces' ? 'bg-white dark:bg-night-card shadow border border-gray-200 dark:border-night-border text-olive dark:text-olive-light' : 'text-gray-600 dark:text-night-muted hover:text-gray-800 dark:hover:text-night-text'}`}
        >
          <Scan className="h-4 w-4" />
          Tenho aparelho (trocar cor da borrachinha)
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('simulate')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === 'simulate' ? 'bg-white dark:bg-night-card shadow border border-gray-200 dark:border-night-border text-olive dark:text-olive-light' : 'text-gray-600 dark:text-night-muted hover:text-gray-800 dark:hover:text-night-text'}`}
        >
          <Smile className="h-4 w-4" />
          Simular aparelho
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-night-muted mb-3">
        {mode === 'has_braces'
          ? 'Aplica a cor escolhida nas borrachinhas do seu aparelho (região da boca). Ideal para testar a cor antes da troca.'
          : 'Desenha um aparelho simulado na boca. Você pode usar um mockup em PNG em public/ar-assets/ (veja o README).'}
      </p>

      <div className="flex-1 rounded-2xl overflow-hidden bg-black relative aspect-[4/3] max-h-[50vh]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        {stream && (
          <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 rounded-lg bg-black/60 text-white text-xs">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {mode === 'has_braces' ? 'Filtro de cor (borrachinhas)' : 'Simulação de aparelho'}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-night-muted mt-2 mb-3">
        Escolha a cor das ligaduras (borrachinhas). A troca é instantânea.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {ELASTIC_COLOR_CATEGORIES.flatMap((category) =>
          category.colors.map(({ name, hex }) => (
            <motion.button
              key={`${category.label}-${hex}`}
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleColorSelect(hex)}
              title={name}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border-2 transition-all shrink-0 ${
                selectedColor === hex
                  ? 'border-olive dark:border-olive-light ring-2 ring-olive/30 dark:ring-olive-light/30 bg-olive/5 dark:bg-olive/10'
                  : 'border-gray-200 dark:border-night-border hover:border-olive/40 dark:hover:border-olive-light/40 bg-white dark:bg-night-card'
              }`}
            >
              <span
                className="w-8 h-8 rounded-full shrink-0 border border-gray-200 dark:border-night-border shadow-sm"
                style={{ backgroundColor: hex }}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-night-text whitespace-nowrap">
                {name}
              </span>
            </motion.button>
          ))
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <motion.button
          type="button"
          onClick={handleSaveImage}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Camera className="h-5 w-5" />
          Salvar foto
        </motion.button>
      </div>
    </div>
  )
}

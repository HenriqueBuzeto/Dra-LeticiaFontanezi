import { useState, useRef, useCallback, useEffect } from 'react'
import { initAREngine, sendFrame, getLastLandmarks } from '@/features/ar/arEngine'
import type { Landmark2D } from '../faceMouthRoi'
import { mouthRoiFromLandmarks, cropToRoi } from '../faceMouthRoi'
import { applyRecolor, maskFromSaturation } from '../recolor'
import { loadSegmentModel, runSegmentInference, isSegmentModelLoaded } from '../segmentation'
import { maskFromManualPoints } from '../segmentation/manualMask'
import { resizeImageData } from '../utils/resize'
import { resizeMask } from '../utils/resize'
import { SEGMENT_INPUT_SIZE, INFERENCE_DEBOUNCE_FRAMES } from '../config'
import { ELASTIC_MANUAL_STORAGE_KEY, type ManualElasticPoints } from '../types'

export interface UseElasticAROptions {
  modelPath?: string
  blendMode?: 'multiply' | 'overlay' | 'color'
}

export interface UseElasticARReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  error: string | null
  loading: boolean
  started: boolean
  selectedColor: string
  setSelectedColor: (hex: string) => void
  startCamera: () => Promise<void>
  stopCamera: () => void
  isManualMode: boolean
  setManualMode: (v: boolean) => void
  manualPoints: ManualElasticPoints | null
  setManualPoints: (p: ManualElasticPoints | null) => void
  saveManualPoints: () => void
  modelLoaded: boolean
}

const DEFAULT_MANUAL: ManualElasticPoints = {
  centerX: 0.5,
  centerY: 0.55,
  radiusX: 0.12,
  radiusY: 0.08,
}

function loadStoredManualPoints(): ManualElasticPoints | null {
  try {
    const s = localStorage.getItem(ELASTIC_MANUAL_STORAGE_KEY)
    if (!s) return null
    const p = JSON.parse(s) as ManualElasticPoints
    if (p && typeof p.centerX === 'number' && typeof p.centerY === 'number') return p
  } catch (_) {}
  return null
}

export function useElasticAR(options: UseElasticAROptions = {}): UseElasticARReturn {
  const { modelPath = '/models/elastic-seg', blendMode = 'overlay' } = options
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const frameCountRef = useRef(0)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [selectedColor, setSelectedColor] = useState('#E53935')
  const [isManualMode, setManualMode] = useState(false)
  const [manualPoints, setManualPointsState] = useState<ManualElasticPoints | null>(() => loadStoredManualPoints())
  const [modelLoaded, setModelLoaded] = useState(false)

  const colorRef = useRef(selectedColor)
  const manualRef = useRef(isManualMode)
  const pointsRef = useRef(manualPoints)
  colorRef.current = selectedColor
  manualRef.current = isManualMode
  pointsRef.current = manualPoints

  const saveManualPoints = useCallback(() => {
    const p = manualPoints ?? DEFAULT_MANUAL
    try {
      localStorage.setItem(ELASTIC_MANUAL_STORAGE_KEY, JSON.stringify(p))
    } catch (_) {}
  }, [manualPoints])

  const setManualPoints = useCallback((p: ManualElasticPoints | null) => {
    setManualPointsState(p)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const ok = await initAREngine()
      if (cancelled) return
      if (!ok) setError('MediaPipe não carregou. Verifique conexão ou use /mediapipe local.')
      const loaded = await loadSegmentModel(modelPath)
      if (!cancelled) setModelLoaded(loaded)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [modelPath])

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStarted(false)
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      setStarted(true)

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = video.videoWidth
      const h = video.videoHeight

      const loop = async () => {
        if (!streamRef.current || !videoRef.current || !canvasRef.current) return
        const v = videoRef.current
        if (v.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop)
          return
        }
        sendFrame(v)
        const landmarks = getLastLandmarks() as Landmark2D[] | null
        ctx.drawImage(v, 0, 0)
        const imageData = ctx.getImageData(0, 0, w, h)
        const currentColor = colorRef.current
        const currentManual = manualRef.current
        const currentPoints = pointsRef.current

        if (currentManual && currentPoints) {
          const maskImg = maskFromManualPoints(w, h, currentPoints)
          applyRecolor(imageData, maskImg, currentColor, blendMode)
          ctx.putImageData(imageData, 0, 0)
        } else if (landmarks && landmarks.length >= 400) {
          const roi = mouthRoiFromLandmarks(landmarks, w, h)
          if (roi && roi.width >= 16 && roi.height >= 16) {
            const cropped = cropToRoi(imageData, roi)
            const resized = resizeImageData(cropped, SEGMENT_INPUT_SIZE, SEGMENT_INPUT_SIZE)
            frameCountRef.current++
            const runInference = frameCountRef.current % INFERENCE_DEBOUNCE_FRAMES === 0 && isSegmentModelLoaded()
            let maskU8: Uint8Array | null = null
            if (runInference) {
              maskU8 = await runSegmentInference(resized)
            }
            if (maskU8 == null) {
              const satMask = maskFromSaturation(resized, 0.18, 0.25, 0.92)
              maskU8 = new Uint8Array(SEGMENT_INPUT_SIZE * SEGMENT_INPUT_SIZE)
              for (let i = 0; i < maskU8.length; i++) maskU8[i] = satMask.data[i * 4]
            }
            const maskRoiW = roi.width
            const maskRoiH = roi.height
            const maskResized = resizeMask(maskU8, SEGMENT_INPUT_SIZE, SEGMENT_INPUT_SIZE, maskRoiW, maskRoiH)
            const roiImageData = ctx.getImageData(roi.x, roi.y, maskRoiW, maskRoiH)
            const maskImg = new ImageData(maskRoiW, maskRoiH)
            for (let i = 0; i < maskRoiW * maskRoiH; i++) {
              const v = maskResized[i]
              maskImg.data[i * 4] = maskImg.data[i * 4 + 1] = maskImg.data[i * 4 + 2] = v
              maskImg.data[i * 4 + 3] = 255
            }
            applyRecolor(roiImageData, maskImg, currentColor, blendMode)
            ctx.putImageData(roiImageData, roi.x, roi.y)
          }
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao acessar câmera')
    }
  }, [blendMode])

  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  return {
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
  }
}

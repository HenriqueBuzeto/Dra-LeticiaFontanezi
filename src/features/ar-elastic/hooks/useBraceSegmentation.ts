import { useState, useRef, useEffect, useCallback } from 'react'
import { initAREngine, sendFrame, getLastLandmarks } from '@/features/ar/arEngine'
import { Landmark2D, mouthRoiFromLandmarks, cropToRoi } from '../faceMouthRoi'
import { enhanceLocalContrast, estimateBrackets, analyzeBraceConfidence, type EstimatedBracket, type BraceDetectionResult } from '../services/imageProcessing'
import { recolorImageWithMask } from '../utils/colorBlend'
import { generateBracketMask, featherMask, type BracketMarker } from '../utils/maskRefinement'

export interface UseBraceSegmentationOptions {
  blendMode?: 'overlay' | 'multiply' | 'color' | 'solid'
}

export function useBraceSegmentation(options: UseBraceSegmentationOptions = {}) {
  const { blendMode = 'overlay' } = options

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null) // Canvas de render final
  const editCanvasRef = useRef<HTMLCanvasElement | null>(null) // Canvas de desenhos manuais (Adição/Subtração)

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null) // Para upload de foto
  const [markers, setMarkers] = useState<BracketMarker[]>([])
  const [selectedColor, setSelectedColor] = useState<string>('#E53935')
  const [alternatingColors, setAlternatingColors] = useState<string[]>(['#2196F3', '#EC407A'])
  const [isAlternating, setIsAlternating] = useState<boolean>(false)

  const [isManualMode, setIsManualMode] = useState<boolean>(false)
  const [brushMode, setBrushMode] = useState<'marker' | 'brush' | 'eraser'>('marker')
  const [brushSize, setBrushSize] = useState<number>(10)
  const [compareMode, setCompareMode] = useState<boolean>(false)

  const [loading, setLoading] = useState<boolean>(true)
  const [started, setStarted] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState<boolean>(false)
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(true)

  const [detectionResult, setDetectionResult] = useState<BraceDetectionResult>({
    confidence: 0,
    bracketsDetected: 0,
    wireDetected: false,
    mouthVisible: false,
    status: 'not_detected',
  })


  const rafRef = useRef<number>(0)
  const originalImageRef = useRef<HTMLImageElement | null>(null)
  const mouthRoiRef = useRef<{ x: number; y: number; width: number; height: number; sourceWidth: number; sourceHeight: number } | null>(null)
  const markersRef = useRef<BracketMarker[]>([])
  const colorsRef = useRef({ selectedColor, alternatingColors, isAlternating })

  markersRef.current = markers
  colorsRef.current = { selectedColor, alternatingColors, isAlternating }

  // Inicializa o MediaPipe
  useEffect(() => {
    let active = true
    initAREngine()
      .then((ok) => {
        if (!active) return
        if (ok) {
          setModelLoaded(true)
        } else {
          setError('Não foi possível carregar o modelo de face localmente ou via CDN.')
        }
        setLoading(false)
      })
      .catch(() => {
        if (active) {
          setError('Erro na inicialização da detecção facial.')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  // Limpa o edit canvas (manual overlay)
  const clearEditCanvas = useCallback(() => {
    const editCanvas = editCanvasRef.current
    if (editCanvas) {
      const ctx = editCanvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, editCanvas.width, editCanvas.height)
      }
    }
  }, [])

  // Inicializa câmera
  const startCamera = useCallback(async () => {
    setError(null)
    setImageSrc(null)
    originalImageRef.current = null
    mouthRoiRef.current = null
    setMarkers([])
    clearEditCanvas()

    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      })
      setStream(s)
      const video = videoRef.current
      if (video) {
        video.srcObject = s
        await video.play()
        setStarted(true)
      }
    } catch (err) {
      setError('Acesso à câmera negado ou indisponível.')
    }
  }, [clearEditCanvas])

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    stream?.getTracks().forEach((track) => track.stop())
    setStream(null)
    setStarted(false)
  }, [stream])

  // Processamento principal (Câmera ao Vivo)
  useEffect(() => {
    if (!started || !stream || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const loop = async () => {
      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      const w = video.videoWidth
      const h = video.videoHeight
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        // Ajusta tamanho do canvas de desenho manual
        const editCanvas = editCanvasRef.current
        if (editCanvas && (editCanvas.width !== w || editCanvas.height !== h)) {
          editCanvas.width = w
          editCanvas.height = h
        }
      }

      // Envia frame pro detector de Landmarks
      sendFrame(video)
      const landmarks = getLastLandmarks() as Landmark2D[] | null

      // Renderiza frame original
      ctx.save()
      ctx.scale(-1, 1) // Espelhar câmera
      ctx.drawImage(video, -w, 0, w, h)
      ctx.restore()

      if (!compareMode) {
        const currentMarkers = markersRef.current
        const { selectedColor: selColor, alternatingColors: altColors, isAlternating: isAlt } = colorsRef.current

        if (landmarks && landmarks.length >= 400) {
          setIsFaceDetected(true)
          const roi = mouthRoiFromLandmarks(landmarks, w, h)

          if (roi) {
            // Ajustamos ROI para ser relativo à câmera espelhada
            // Como espelhamos o desenho, as coordenadas x dos marcadores/landmarks precisam ser consistentes
            // A ROI do landmarks já está no espaço correto do vídeo, mas como espelhamos no canvas,
            // precisamos tratar as posições corretamente.
            mouthRoiRef.current = roi

            // Se ainda não temos marcadores, estimamos com base nos landmarks detectados
            if (currentMarkers.length === 0) {
              const estimated = estimateBrackets(landmarks, w, h)
              if (estimated.length > 0) {
                // Mapeia para o tipo BracketMarker
                const mapped: BracketMarker[] = estimated.map((b) => ({
                  id: b.id,
                  // Ajusta o X devido ao espelhamento da câmera
                  x: 1.0 - b.x,
                  y: b.y,
                  radiusX: b.radiusX,
                  radiusY: b.radiusY,
                  arch: b.arch,
                }))
                setMarkers(mapped)
              }
            }

            // Gera a máscara e recolore apenas se houver marcadores
            if (currentMarkers.length > 0) {
              const rawImg = ctx.getImageData(0, 0, w, h)
              
              // Executa a análise de confiança
              const result = analyzeBraceConfidence(rawImg, currentMarkers, true)
              setDetectionResult(result)

              if (result.status !== 'not_detected') {
                // Gera máscara de aparelho baseada nos marcadores
                const baseMask = generateBracketMask(w, h, currentMarkers, rawImg)

                // Incorpora pincel / borracha manuais do edit canvas
                const editCanvas = editCanvasRef.current
                if (editCanvas) {
                  const editCtx = editCanvas.getContext('2d')
                  if (editCtx) {
                    const editData = editCtx.getImageData(0, 0, w, h).data
                    for (let i = 0; i < baseMask.length; i++) {
                      const idx = i * 4
                      const r = editData[idx]     // Vermelho = Apagar (Eraser)
                      const g = editData[idx + 1] // Verde = Pintar (Brush)
                      const a = editData[idx + 3]
                      if (a > 10) {
                        if (g > 150) {
                          baseMask[i] = 255
                        } else if (r > 150) {
                          baseMask[i] = 0
                        }
                      }
                    }
                  }
                }

                // Suaviza a máscara (Feather)
                const smoothedMask = featherMask(baseMask, w, h, 2)

                // Recolore bracket-by-bracket para suportar cores alternadas
                for (let idx = 0; idx < currentMarkers.length; idx++) {
                  const marker = currentMarkers[idx]
                  const color = isAlt ? altColors[idx % altColors.length] : selColor

                  // Extrai área de máscara local do marcador
                  const mx = marker.x * w
                  const my = marker.y * h
                  const mrx = marker.radiusX * w * 1.5
                  const mry = marker.radiusY * h * 1.5

                  const minX = Math.max(0, Math.floor(mx - mrx))
                  const maxX = Math.min(w - 1, Math.ceil(mx + mrx))
                  const minY = Math.max(0, Math.floor(my - mry))
                  const maxY = Math.min(h - 1, Math.ceil(my + mry))

                  // Executa recoloração nessa caixa delimitadora local
                  for (let y = minY; y <= maxY; y++) {
                    for (let x = minX; x <= maxX; x++) {
                      const maskVal = smoothedMask[y * w + x]
                      if (maskVal > 10) {
                        const pixelIdx = (y * w + x) * 4
                        // Recolore diretamente no ImageData geral
                        recolorImageWithMask(
                          rawImg,
                          new Uint8Array([maskVal]),
                          color,
                          blendMode
                        )
                      }
                    }
                  }
                }

                ctx.putImageData(rawImg, 0, 0)
              }
            }
          }
        } else {
          // Se sumir o rosto da câmera por mais de alguns frames, não limpamos marcadores de imediato,
          // mas sinalizamos a falha.
          setIsFaceDetected(false)
        }
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [started, stream, compareMode, blendMode])

  // Trata upload de imagem
  const handleImageUpload = useCallback(
    (file: File) => {
      stopCamera()
      setError(null)
      setMarkers([])
      clearEditCanvas()

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setImageSrc(dataUrl)

        const img = new Image()
        img.onload = () => {
          originalImageRef.current = img
          const canvas = canvasRef.current
          if (canvas) {
            canvas.width = img.naturalWidth
            canvas.height = img.naturalHeight
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0)
            }

            // Atualiza tamanho do edit canvas
            const editCanvas = editCanvasRef.current
            if (editCanvas) {
              editCanvas.width = img.naturalWidth
              editCanvas.height = img.naturalHeight
            }

            // Roda landmark detection uma vez na imagem estática
            // Usando canvas intermediário para passar ao detector
            setTimeout(() => {
              sendFrame(canvas)
              setTimeout(() => {
                const landmarks = getLastLandmarks() as Landmark2D[] | null
                if (landmarks && landmarks.length >= 400) {
                  setIsFaceDetected(true)
                  const estimated = estimateBrackets(landmarks, img.naturalWidth, img.naturalHeight)
                  if (estimated.length > 0) {
                    setMarkers(
                      estimated.map((b) => ({
                        id: b.id,
                        x: b.x,
                        y: b.y,
                        radiusX: b.radiusX,
                        radiusY: b.radiusY,
                        arch: b.arch,
                      }))
                    )
                  }
                } else {
                  setIsFaceDetected(false)
                  // Se falhar auto-detecção em imagem, coloca marcadores manuais sugeridos no meio da tela
                  const mockMarkers: BracketMarker[] = []
                  const centerW = 0.5
                  const centerH = 0.5
                  const stepX = 0.04
                  for (let i = 0; i < 6; i++) {
                    const offset = (i - 2.5) * stepX
                    mockMarkers.push({
                      id: `upper-${i}`,
                      x: centerW + offset,
                      y: centerH - 0.04,
                      radiusX: 0.016,
                      radiusY: 0.014,
                      arch: 'upper',
                    })
                    mockMarkers.push({
                      id: `lower-${i}`,
                      x: centerW + offset,
                      y: centerH + 0.04,
                      radiusX: 0.016,
                      radiusY: 0.014,
                      arch: 'lower',
                    })
                  }
                  setMarkers(mockMarkers)
                }
              }, 500)
            }, 200)
          }
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    },
    [stopCamera, clearEditCanvas]
  )

  // Atualiza renderização de imagem estática quando marcadores/cores mudam
  const renderStaticSimulation = useCallback(() => {
    const img = originalImageRef.current
    const canvas = canvasRef.current
    if (!img || !canvas || started) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = img.naturalWidth
    const h = img.naturalHeight

    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0)

    if (compareMode) return

    const currentMarkers = markers
    if (currentMarkers.length === 0) return

    const rawImg = ctx.getImageData(0, 0, w, h)
    
    // Executa a análise de confiança
    const result = analyzeBraceConfidence(rawImg, currentMarkers, isFaceDetected)
    setDetectionResult(result)

    if (result.status === 'not_detected') {
      return
    }

    const baseMask = generateBracketMask(w, h, currentMarkers, rawImg)

    // Adiciona desenhos manuais
    const editCanvas = editCanvasRef.current
    if (editCanvas) {
      const editCtx = editCanvas.getContext('2d')
      if (editCtx) {
        const editData = editCtx.getImageData(0, 0, w, h).data
        for (let i = 0; i < baseMask.length; i++) {
          const idx = i * 4
          const r = editData[idx]
          const g = editData[idx + 1]
          const a = editData[idx + 3]
          if (a > 10) {
            if (g > 150) baseMask[i] = 255
            else if (r > 150) baseMask[i] = 0
          }
        }
      }
    }

    const smoothedMask = featherMask(baseMask, w, h, 2)

    for (let idx = 0; idx < currentMarkers.length; idx++) {
      const marker = currentMarkers[idx]
      const color = isAlternating ? alternatingColors[idx % alternatingColors.length] : selectedColor

      const mx = marker.x * w
      const my = marker.y * h
      const mrx = marker.radiusX * w * 1.5
      const mry = marker.radiusY * h * 1.5

      const minX = Math.max(0, Math.floor(mx - mrx))
      const maxX = Math.min(w - 1, Math.ceil(mx + mrx))
      const minY = Math.max(0, Math.floor(my - mry))
      const maxY = Math.min(h - 1, Math.ceil(my + mry))

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const maskVal = smoothedMask[y * w + x]
          if (maskVal > 10) {
            const pixelIdx = (y * w + x) * 4
            // Blend pixel unitário
            const r = rawImg.data[pixelIdx]
            const g = rawImg.data[pixelIdx + 1]
            const b = rawImg.data[pixelIdx + 2]
            const targetColorRGB = {
              r: parseInt(color.slice(1, 3), 16),
              g: parseInt(color.slice(3, 5), 16),
              b: parseInt(color.slice(5, 7), 16),
            }
            
            // Usamos a função de blend do colorBlend.ts importada de forma inline/manual
            const blended = recolorImageWithMask(
              rawImg,
              new Uint8Array([maskVal]),
              color,
              blendMode
            )
          }
        }
      }
    }

    ctx.putImageData(rawImg, 0, 0)
  }, [markers, selectedColor, alternatingColors, isAlternating, compareMode, started, blendMode])

  useEffect(() => {
    if (!started && originalImageRef.current) {
      renderStaticSimulation()
    }
  }, [renderStaticSimulation, started])

  // Ações manuais na tela (desenho ou arrastar marcadores)
  const drawManualAction = useCallback(
    (x: number, y: number, isStart = false) => {
      const editCanvas = editCanvasRef.current
      if (!editCanvas || brushMode === 'marker') return

      const ctx = editCanvas.getContext('2d')
      if (!ctx) return

      ctx.save()
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (brushMode === 'brush') {
        ctx.strokeStyle = '#00FF00' // Verde para Adição
        ctx.globalCompositeOperation = 'source-over'
      } else {
        ctx.strokeStyle = '#FF0000' // Vermelho para Remoção
        ctx.globalCompositeOperation = 'source-over'
      }

      if (isStart) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y)
        ctx.stroke()
      } else {
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      ctx.restore()

      // Força rerender da imagem estática
      if (!started && originalImageRef.current) {
        renderStaticSimulation()
      }
    },
    [brushMode, brushSize, started, renderStaticSimulation]
  )

  // Salvar simulação local
  const saveSimulation = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `simulacao-borrachinhas-${selectedColor.replace('#', '')}.png`
    a.click()
  }, [selectedColor])

  return {
    videoRef,
    canvasRef,
    editCanvasRef,
    stream,
    imageSrc,
    markers,
    setMarkers,
    selectedColor,
    setSelectedColor,
    alternatingColors,
    setAlternatingColors,
    isAlternating,
    setIsAlternating,
    isManualMode,
    setIsManualMode,
    brushMode,
    setBrushMode,
    brushSize,
    setBrushSize,
    compareMode,
    setCompareMode,
    loading,
    started,
    error,
    modelLoaded,
    isFaceDetected,
    detectionResult,
    startCamera,
    stopCamera,
    handleImageUpload,
    drawManualAction,
    clearEditCanvas,
    saveSimulation,
  }
}

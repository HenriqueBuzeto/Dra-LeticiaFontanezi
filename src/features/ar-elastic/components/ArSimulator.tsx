import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  Brush,
  Eraser,
  Save,
  Send,
  Info,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useBraceSegmentation } from '../hooks/useBraceSegmentation'
import { ElasticColorSelector } from './ElasticColorSelector'

export function ArSimulator() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  const {
    videoRef,
    canvasRef,
    editCanvasRef,
    started,
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
    hasManuallyAdjusted,
    mediaAspectRatio,
    brushMode,
    setBrushMode,
    brushSize,
    setBrushSize,
    compareMode,
    setCompareMode,
    loading,
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
  } = useBraceSegmentation({ blendMode: 'overlay' })

  // Controle de Arrastar Marcador
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Envia para clínica (Simulado com sucesso visual)
  const handleSendToClinic = () => {
    setShowSuccessModal(true)
    setTimeout(() => {
      setShowSuccessModal(false)
    }, 3000)
  }

  // Eventos de Pointer para Pintar/Apagar no Canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (brushMode === 'marker') return
    const canvas = editCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    // Como a imagem pode estar redimensionada no CSS, calculamos a posição real no canvas
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height
    drawManualAction(x, y, true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (brushMode === 'marker') return
    const canvas = editCanvasRef.current
    if (!canvas || e.buttons !== 1) return
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height
    drawManualAction(x, y, false)
  }

  // Adicionar novo marcador
  const handleAddMarker = () => {
    const newId = `custom-${Date.now()}`
    setMarkers((prev) => [
      ...prev,
      {
        id: newId,
        x: 0.5,
        y: 0.5,
        radiusX: 0.018,
        radiusY: 0.014,
        arch: 'upper',
      },
    ])
  }

  // Remover marcador
  const handleRemoveMarker = (id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id))
  }

  // Lógica de arrastar marcadores via DOM
  const handleMarkerDragStart = (e: React.PointerEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const marker = markers.find((m) => m.id === id)
    if (!marker || !previewContainerRef.current) return

    const rect = previewContainerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    dragOffsetRef.current = {
      x: x - marker.x,
      y: y - marker.y,
    }
    setActiveDragId(id)
  }

  useEffect(() => {
    if (!activeDragId) return

    const handlePointerMoveGlobal = (e: PointerEvent) => {
      if (!previewContainerRef.current) return
      const rect = previewContainerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height

      const newX = Math.max(0.01, Math.min(0.99, x - dragOffsetRef.current.x))
      const newY = Math.max(0.01, Math.min(0.99, y - dragOffsetRef.current.y))

      setMarkers((prev) =>
        prev.map((m) => (m.id === activeDragId ? { ...m, x: newX, y: newY } : m))
      )
    }

    const handlePointerUpGlobal = () => {
      setActiveDragId(null)
    }

    window.addEventListener('pointermove', handlePointerMoveGlobal)
    window.addEventListener('pointerup', handlePointerUpGlobal)

    return () => {
      window.removeEventListener('pointermove', handlePointerMoveGlobal)
      window.removeEventListener('pointerup', handlePointerUpGlobal)
    }
  }, [activeDragId, setMarkers])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Coluna do Preview (Vídeo ou Imagem) */}
      <div className="lg:col-span-7 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={started ? stopCamera : startCamera}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm transition ${
                started
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-olive text-white hover:opacity-90 shadow-lg shadow-olive/15'
              }`}
            >
              <Camera className="w-4 h-4" />
              {started ? 'Parar Câmera' : 'Usar Câmera'}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-card hover:bg-gray-50 dark:hover:bg-night-surface text-gray-700 dark:text-night-text text-sm font-semibold transition"
            >
              <Upload className="w-4 h-4 text-olive" />
              Enviar Foto
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file)
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onMouseDown={() => setCompareMode(true)}
              onMouseUp={() => setCompareMode(false)}
              onTouchStart={() => setCompareMode(true)}
              onTouchEnd={() => setCompareMode(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-night-surface hover:bg-gray-200 dark:hover:bg-night-border text-gray-700 dark:text-night-text text-sm font-semibold transition select-none"
              title="Mantenha pressionado para ver a foto original sem recoloração"
            >
              {compareMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Antes / Depois
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Indicador Visual do Nível de Confiança */}
        {(started || imageSrc) && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-night-card border border-gray-150 dark:border-night-border shadow-soft">
            <span className="text-xs font-semibold text-gray-500">Qualidade da Detecção:</span>
            <div className="flex items-center gap-2">
              {detectionResult.status === 'detected' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-xs font-bold border border-green-200/40">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Aparelho Detectado ({detectionResult.confidence}%)
                </span>
              )}
              {detectionResult.status === 'partial' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs font-bold border border-amber-200/40">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Possível Aparelho ({detectionResult.confidence}%)
                </span>
              )}
              {detectionResult.status === 'not_detected' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs font-bold border border-rose-200/40">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Aparelho Não Detectado ({detectionResult.confidence}%)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Alerta de Detecção Parcial (Nível 2) */}
        {(started || imageSrc) && detectionResult.status === 'partial' && !isManualMode && !hasManuallyAdjusted && (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 space-y-2.5">
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-1.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              Encontramos possíveis elementos de aparelho ortodôntico, mas a identificação não foi totalmente precisa. Você pode ajustar manualmente os marcadores para melhorar a simulação.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsManualMode(true)
                setBrushMode('marker')
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-night-surface border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100/30 transition shadow-sm"
            >
              Ajustar Marcadores
            </button>
          </div>
        )}

        {/* Container Interativo do Preview */}
        <div
          ref={previewContainerRef}
          style={{ aspectRatio: mediaAspectRatio || '4/3' }}
          className="relative w-full rounded-3xl overflow-hidden bg-black/90 max-h-[60vh] border border-gray-100 dark:border-night-border shadow-inner flex items-center justify-center select-none"
        >
          {/* Vídeo da Câmera */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="hidden"
            aria-hidden="true"
          />

          {/* Canvas de Renderização Principal */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
          />

          {/* Canvas para Pintar Máscara Manualmente (Overlay) */}
          <canvas
            ref={editCanvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            className={`absolute inset-0 w-full h-full object-cover ${
              brushMode !== 'marker' ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
            }`}
            style={{ display: isManualMode && brushMode !== 'marker' ? 'block' : 'none' }}
          />

          {/* Marcadores de Brackets Editáveis (Overlay) */}
          {isManualMode && brushMode === 'marker' && markers.map((marker) => {
            // Mapeia posições 0..1 para porcentagens
            // Se a câmera estiver rodando, as coordenadas foram invertidas para o espelhamento
            const xPercent = marker.x * 100
            const yPercent = marker.y * 100

            return (
              <div
                key={marker.id}
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  width: `${marker.radiusX * 2 * 100}%`,
                  height: `${marker.radiusY * 2 * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute border border-dashed border-white rounded-full bg-olive/15 flex items-center justify-center pointer-events-auto"
              >
                {/* Botão de Excluir Marcador */}
                <button
                  type="button"
                  onClick={() => handleRemoveMarker(marker.id)}
                  className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md border border-white"
                  title="Remover este bracket"
                >
                  &times;
                </button>

                {/* Centro do Marcador (Arrastável) */}
                <div
                  onPointerDown={(e) => handleMarkerDragStart(e, marker.id)}
                  className="w-4 h-4 rounded-full bg-white/95 border border-olive shadow cursor-move flex items-center justify-center"
                  title="Arraste para mover o bracket"
                >
                  <span className="w-1 h-1 rounded-full bg-olive" />
                </div>
              </div>
            )
          })}

          {/* Card: Aparelho Não Identificado (Nível 3) */}
          {(started || imageSrc) && detectionResult.status === 'not_detected' && !isManualMode && !hasManuallyAdjusted && (
            <div className="absolute inset-0 bg-white/95 dark:bg-night-card/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center z-10 select-text">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center mb-3">
                <AlertCircle className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-night-text text-base">🦷 Aparelho não identificado</h3>
              <p className="text-xs text-gray-500 dark:text-night-muted max-w-xs mt-1 leading-relaxed">
                Não conseguimos localizar um aparelho ortodôntico na foto enviada.
              </p>
              
              <div className="w-full max-w-xs bg-gray-50 dark:bg-night-surface rounded-2xl p-4 text-left border border-gray-150 dark:border-night-border mt-4 space-y-1.5">
                <p className="text-xs font-semibold text-gray-700 dark:text-night-text">Para uma melhor experiência:</p>
                <ul className="text-xs text-gray-500 dark:text-night-muted list-disc list-inside space-y-1">
                  <li>Tire uma foto frontal sorrindo</li>
                  <li>Mantenha boa iluminação</li>
                  <li>Deixe os dentes visíveis</li>
                  <li>Evite filtros ou fotos desfocadas</li>
                </ul>
              </div>
              
              <div className="flex gap-2.5 w-full max-w-xs mt-5">
                <button
                  type="button"
                  onClick={() => {
                    if (started) {
                      stopCamera()
                      startCamera()
                    } else {
                      fileInputRef.current?.click()
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-olive hover:opacity-90 text-white text-xs font-bold shadow transition"
                >
                  Tirar Nova Foto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsManualMode(true)
                    setBrushMode('marker')
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border text-gray-700 dark:text-night-text hover:bg-gray-50 text-xs font-bold transition"
                >
                  Ajustar Manual
                </button>
              </div>
            </div>
          )}

          {/* Estado de Carregamento */}
          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-3">
              <Loader2 className="w-8 h-8 text-olive animate-spin" />
              <span className="text-sm font-semibold">Carregando Simulador AR...</span>
            </div>
          )}

          {/* Estado Sem Câmera/Foto Iniciados */}
          {!started && !imageSrc && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-gray-400 gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-night-surface border border-gray-200 dark:border-night-border flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-olive" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-night-text text-base">Visualize as Borrachinhas</p>
                <p className="text-xs text-gray-500 max-w-xs mt-1">
                  Ative a câmera ou selecione uma foto para simular as cores no seu aparelho fixo em tempo real.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-400 dark:text-night-muted flex items-start gap-1">
          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          A simulação pode variar conforme a iluminação da foto original. O resultado final serve como referência visual.
        </p>
      </div>

      {/* Painel Lateral de Controle */}
      <div className="lg:col-span-5 space-y-6">
        {/* Seletor de Cores */}
        <div className="card-glass border border-gray-mist dark:border-night-border p-5 rounded-3xl space-y-3 bg-white/80 dark:bg-night-card backdrop-blur-md">
          <h2 className="text-sm font-bold text-gray-800 dark:text-night-text flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-olive" />
            Escolha a Cor das Borrachinhas
          </h2>
          <ElasticColorSelector
            selectedColor={selectedColor}
            onChangeColor={setSelectedColor}
            isAlternating={isAlternating}
            onChangeAlternating={setIsAlternating}
            alternatingColors={alternatingColors}
            onChangeAlternatingColors={setAlternatingColors}
          />
        </div>

        {/* Ajuste Fino / Modo Manual */}
        <div className="card-glass border border-gray-mist dark:border-night-border p-5 rounded-3xl space-y-3 bg-white/80 dark:bg-night-card backdrop-blur-md">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 dark:text-night-text flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-olive" />
              Ajuste Fino
            </h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isManualMode}
                onChange={(e) => {
                  setIsManualMode(e.target.checked)
                  if (!e.target.checked) setBrushMode('marker')
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 dark:bg-night-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-olive" />
            </label>
          </div>

          <p className="text-xs text-gray-500">
            Ative o ajuste fino se a inteligência artificial não detectar perfeitamente o aparelho na foto.
          </p>

          <AnimatePresence>
            {isManualMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 space-y-3 border-t border-gray-100 dark:border-night-border overflow-hidden"
              >
                {/* Ferramentas de Pincel/Marcador */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBrushMode('marker')}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl border text-xs font-semibold gap-1 transition ${
                      brushMode === 'marker'
                        ? 'border-olive bg-olive/10 text-olive'
                        : 'border-gray-200 dark:border-night-border bg-white dark:bg-night-card hover:bg-gray-50 text-gray-700 dark:text-night-text'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                    Brackets
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrushMode('brush')}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl border text-xs font-semibold gap-1 transition ${
                      brushMode === 'brush'
                        ? 'border-olive bg-olive/10 text-olive'
                        : 'border-gray-200 dark:border-night-border bg-white dark:bg-night-card hover:bg-gray-50 text-gray-700 dark:text-night-text'
                    }`}
                  >
                    <Brush className="w-4 h-4" />
                    Pincel
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrushMode('eraser')}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl border text-xs font-semibold gap-1 transition ${
                      brushMode === 'eraser'
                        ? 'border-olive bg-olive/10 text-olive'
                        : 'border-gray-200 dark:border-night-border bg-white dark:bg-night-card hover:bg-gray-50 text-gray-700 dark:text-night-text'
                    }`}
                  >
                    <Eraser className="w-4 h-4" />
                    Borracha
                  </button>
                </div>

                {brushMode === 'marker' ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      💡 <strong>Modo Brackets:</strong> Mova os círculos de seleção diretamente na foto para alinhar sobre cada dente.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleAddMarker}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border text-xs font-bold hover:bg-gray-50 dark:hover:bg-night-border transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-olive" />
                        Adicionar Bracket
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      💡 <strong>Pintura Manual:</strong> Toque e arraste para desenhar borrachinhas extras (Verde) ou apagar imperfeições (Vermelho).
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-600 dark:text-night-muted">Tamanho do pincel:</span>
                      <input
                        type="range"
                        min="3"
                        max="30"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="flex-1 accent-olive h-1 rounded-full cursor-pointer bg-gray-200"
                      />
                      <span className="text-xs font-bold text-gray-700 dark:text-night-text">{brushSize}px</span>
                    </div>
                    <button
                      type="button"
                      onClick={clearEditCanvas}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-gray-200 dark:border-night-border text-xs text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Limpar Desenhos
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ações de Exportação */}
        {(started || imageSrc) && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={saveSimulation}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-night-card border border-gray-200 dark:border-night-border text-gray-700 dark:text-night-text hover:bg-gray-50 dark:hover:bg-night-surface text-sm font-bold shadow-soft transition"
            >
              <Save className="w-4 h-4 text-olive" />
              Salvar Simulação
            </button>

            <button
              type="button"
              onClick={handleSendToClinic}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-olive text-white hover:opacity-90 text-sm font-bold shadow-lg shadow-olive/20 transition"
            >
              <Send className="w-4 h-4" />
              Enviar para Clínica
            </button>
          </div>
        )}
      </div>

      {/* Modal / Toast de Sucesso Simulado */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-4 rounded-3xl bg-gray-900 text-white shadow-2xl border border-gray-800"
          >
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">Simulação Enviada!</p>
              <p className="text-xs text-gray-400">Sua escolha de cor foi compartilhada com a clínica.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
export default ArSimulator

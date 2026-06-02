import { useMemo } from 'react'

export interface ElasticColorSelectorProps {
  selectedColor: string
  onChangeColor: (hex: string) => void
  isAlternating: boolean
  onChangeAlternating: (active: boolean) => void
  alternatingColors: string[]
  onChangeAlternatingColors: (colors: string[]) => void
  className?: string
}

export function ElasticColorSelector({
  selectedColor,
  onChangeColor,
  isAlternating,
  onChangeAlternating,
  alternatingColors,
  onChangeAlternatingColors,
  className = '',
}: ElasticColorSelectorProps) {
  const standardColors = useMemo(
    () => [
      { name: 'Azul Clássico', hex: '#2196F3' },
      { name: 'Azul Bebê', hex: '#9CCBFF' },
      { name: 'Rosa Chiclete', hex: '#EC407A' },
      { name: 'Roxo Uva', hex: '#9C27B0' },
      { name: 'Vermelho Rubi', hex: '#E53935' },
      { name: 'Verde Menta', hex: '#009688' },
      { name: 'Amarelo Ouro', hex: '#FFC107' },
      { name: 'Preto Absoluto', hex: '#212121' },
      { name: 'Branco Pérola', hex: '#F5F5F5' },
      { name: 'Prata Metálico', hex: '#9E9E9E' },
    ],
    []
  )

  const neonColors = useMemo(
    () => [
      { name: 'Verde Neon', hex: '#39FF14' },
      { name: 'Rosa Neon', hex: '#FF007F' },
      { name: 'Azul Neon', hex: '#00E5FF' },
      { name: 'Amarelo Neon', hex: '#FFF000' },
      { name: 'Laranja Neon', hex: '#FF5F1F' },
    ],
    []
  )

  const alternatingThemes = useMemo(
    () => [
      { name: 'Azul & Rosa', colors: ['#2196F3', '#EC407A'] },
      { name: 'Verde & Amarelo', colors: ['#4CAF50', '#FFEB3B'] },
      { name: 'Roxo & Laranja', colors: ['#9C27B0', '#FF5F1F'] },
      { name: 'Preto & Branco', colors: ['#212121', '#F5F5F5'] },
      { name: 'Festa (Rosa & Roxo)', colors: ['#FF007F', '#9C27B0'] },
    ],
    []
  )

  const handleSelectStandard = (hex: string) => {
    onChangeAlternating(false)
    onChangeColor(hex)
  }

  const handleSelectAlternating = (colors: string[]) => {
    onChangeAlternating(true)
    onChangeAlternatingColors(colors)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Abas / Categorias */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Cores Clássicas
        </span>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {standardColors.map((color) => {
            const active = !isAlternating && selectedColor.toLowerCase() === color.hex.toLowerCase()
            return (
              <button
                key={color.hex}
                type="button"
                title={color.name}
                onClick={() => handleSelectStandard(color.hex)}
                className={`w-9 h-9 rounded-xl border-2 transition-all relative flex items-center justify-center ${
                  active
                    ? 'border-olive dark:border-accent-purple scale-110 ring-2 ring-offset-2 ring-olive/40'
                    : 'border-gray-200 dark:border-night-border hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {active && (
                  <span className="w-2 h-2 rounded-full bg-white dark:bg-black shadow" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Cores Neon Vibrantes
        </span>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {neonColors.map((color) => {
            const active = !isAlternating && selectedColor.toLowerCase() === color.hex.toLowerCase()
            return (
              <button
                key={color.hex}
                type="button"
                title={color.name}
                onClick={() => handleSelectStandard(color.hex)}
                className={`w-9 h-9 rounded-xl border-2 transition-all relative flex items-center justify-center ${
                  active
                    ? 'border-olive dark:border-accent-purple scale-110 ring-2 ring-offset-2 ring-olive/40'
                    : 'border-gray-200 dark:border-night-border hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex }}
              >
                {active && (
                  <span className="w-2 h-2 rounded-full bg-white dark:bg-black shadow" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Combinações Alternadas (2 Cores)
        </span>
        <div className="flex flex-wrap gap-3 mt-1.5">
          {alternatingThemes.map((theme) => {
            const isSelectedTheme =
              isAlternating &&
              alternatingColors.length === theme.colors.length &&
              alternatingColors[0] === theme.colors[0] &&
              alternatingColors[1] === theme.colors[1]

            return (
              <button
                key={theme.name}
                type="button"
                onClick={() => handleSelectAlternating(theme.colors)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 text-xs font-medium transition-all ${
                  isSelectedTheme
                    ? 'border-olive dark:border-accent-purple bg-olive/10 dark:bg-accent-purple/10 scale-105 shadow-sm'
                    : 'border-gray-200 dark:border-night-border bg-white dark:bg-night-card hover:bg-gray-50 dark:hover:bg-night-surface'
                }`}
              >
                <div className="flex -space-x-1.5">
                  <div
                    className="w-5 h-5 rounded-full border border-white dark:border-night-card shadow-sm"
                    style={{ backgroundColor: theme.colors[0] }}
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-white dark:border-night-card shadow-sm"
                    style={{ backgroundColor: theme.colors[1] }}
                  />
                </div>
                <span className="text-gray-700 dark:text-night-text">{theme.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-night-card border border-gray-200 dark:border-night-border px-3 py-1.5 rounded-2xl shadow-soft">
          <span className="text-xs font-medium text-gray-600 dark:text-night-muted">Cor Personalizada:</span>
          <input
            type="color"
            value={isAlternating ? '#E53935' : selectedColor}
            onChange={(e) => handleSelectStandard(e.target.value)}
            className="w-8 h-8 rounded-xl cursor-pointer border border-gray-200 dark:border-night-border overflow-hidden"
          />
        </label>
      </div>
    </div>
  )
}

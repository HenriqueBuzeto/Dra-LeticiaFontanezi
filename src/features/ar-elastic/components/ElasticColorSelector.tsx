import { useMemo } from 'react'
import { DEFAULT_ELASTIC_COLORS } from '../config'

export interface ElasticColorSelectorProps {
  value: string
  onChange: (hex: string) => void
  className?: string
}

export function ElasticColorSelector({ value, onChange, className = '' }: ElasticColorSelectorProps) {
  const colors = useMemo(() => [...DEFAULT_ELASTIC_COLORS], [])
  const normalizedValue = value.startsWith('#') ? value : `#${value}`

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {colors.map((hex) => (
        <button
          key={hex}
          type="button"
          title={hex}
          onClick={() => onChange(hex)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            (normalizedValue.toLowerCase() === hex.toLowerCase())
              ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-2 ring-olive dark:ring-accent-purple'
              : 'border-transparent hover:scale-105'
          }`}
          style={{ backgroundColor: hex }}
          aria-label={`Cor ${hex}`}
        />
      ))}
      <label className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500 dark:text-night-muted">Custom:</span>
        <input
          type="color"
          value={normalizedValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-300 dark:border-night-border"
        />
      </label>
    </div>
  )
}

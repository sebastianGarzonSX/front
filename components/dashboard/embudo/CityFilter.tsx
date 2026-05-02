'use client'

import { CityKey, CITIES } from '@/types'

interface CityFilterProps {
  selected: CityKey | null
  onChange: (city: CityKey | null) => void
}

export function CityFilter({ selected, onChange }: CityFilterProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[9px] font-[var(--font-mono)] uppercase tracking-[0.16em] text-[var(--color-ink-3)] mr-1">
        Ciudad
      </span>

      <button
        onClick={() => onChange(null)}
        className={`
          px-3 py-1.5 rounded-full text-[11px] font-[var(--font-mono)] border
          transition-all duration-150
          ${selected === null
            ? 'bg-[var(--color-gold-glow)] border-[var(--color-gold-dim)] text-[var(--color-gold)]'
            : 'border-[var(--color-border)] text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)] hover:border-[var(--color-border-2)]'}
        `}
      >
        Todas
      </button>

      {CITIES.map((city) => (
        <button
          key={city.key}
          onClick={() => onChange(city.key)}
          className={`
            px-3 py-1.5 rounded-full text-[11px] font-[var(--font-mono)] border
            transition-all duration-150
            ${selected === city.key
              ? 'bg-[var(--color-gold-glow)] border-[var(--color-gold-dim)] text-[var(--color-gold)]'
              : 'border-[var(--color-border)] text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)] hover:border-[var(--color-border-2)]'}
          `}
        >
          {city.label}
        </button>
      ))}
    </div>
  )
}

'use client'

interface DateRangeSelectorProps {
  since: string
  until: string
  onChange: (since: string, until: string) => void
}

const PRESETS = [
  { label: '7d',  days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)
}

export function DateRangeSelector({ since, until, onChange }: DateRangeSelectorProps) {
  const today = new Date().toISOString().slice(0, 10)

  function applyPreset(days: number) {
    onChange(daysAgo(days), today)
  }

  const activePreset = PRESETS.find((p) => since === daysAgo(p.days) && until === today)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Quick presets */}
      <div className="flex items-center gap-1 p-0.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-sm)]">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => applyPreset(p.days)}
            className={`
              px-2.5 py-1 rounded-[2px] text-[10px] font-[var(--font-mono)] tracking-wider uppercase
              transition-all duration-100
              ${activePreset?.days === p.days
                ? 'bg-[var(--color-gold)] text-[var(--color-canvas)] font-semibold'
                : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]'
              }
            `}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom range */}
      <div className="flex items-center gap-1.5 text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
        <input
          type="date"
          value={since}
          max={until}
          onChange={(e) => onChange(e.target.value, until)}
          className="
            bg-transparent border border-[var(--color-border)] rounded-[var(--radius-sm)]
            px-2 py-1 text-[10px] font-[var(--font-mono)] text-[var(--color-ink-2)]
            focus:outline-none focus:border-[var(--color-gold)]
            [color-scheme:dark]
          "
        />
        <span className="text-[var(--color-border-2)]">→</span>
        <input
          type="date"
          value={until}
          min={since}
          max={today}
          onChange={(e) => onChange(since, e.target.value)}
          className="
            bg-transparent border border-[var(--color-border)] rounded-[var(--radius-sm)]
            px-2 py-1 text-[10px] font-[var(--font-mono)] text-[var(--color-ink-2)]
            focus:outline-none focus:border-[var(--color-gold)]
            [color-scheme:dark]
          "
        />
      </div>
    </div>
  )
}

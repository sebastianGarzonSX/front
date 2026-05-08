'use client'

import { SurveyBreakdownResponse } from '@/types'
import { formatNumber } from '@/components/dashboard/KPICard'

interface SurveyBreakdownProps {
  data:      SurveyBreakdownResponse | null
  isLoading: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  dolores:  '#D95F5F',
  ventas:   '#C9973A',
  claridad: '#5C9FD4',
  equipos:  '#3DAB6E',
}

const CATEGORY_ICONS: Record<string, string> = {
  dolores:  '⚡',
  ventas:   '📈',
  claridad: '🔍',
  equipos:  '👥',
}

export function SurveyBreakdown({ data, isLoading }: SurveyBreakdownProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[80, 65, 45, 30].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-3 w-3 rounded-full flex-shrink-0" />
            <div className="flex-1 h-8 skeleton rounded" style={{ maxWidth: `${w}%` }} />
            <div className="skeleton h-4 w-8 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.total === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-3)] text-center py-8">
        Sin respuestas de muestreo en este período.
      </p>
    )
  }

  const sorted = [...data.categories].sort((a, b) => b.count - a.count)
  const maxCount = Math.max(...sorted.map((c) => c.count), 1)

  return (
    <div className="space-y-3">
      {sorted.map((cat) => {
        const color   = CATEGORY_COLORS[cat.category] ?? 'var(--color-gold)'
        const icon    = CATEGORY_ICONS[cat.category] ?? '●'
        const barPct  = Math.round((cat.count / maxCount) * 100)

        return (
          <div key={cat.category} className="group flex items-center gap-3 rounded-[var(--radius-sm)] py-1 px-1 hover:bg-[var(--color-surface-2)] transition-colors">
            {/* Ícono / color dot */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px]"
              style={{ background: color + '22', border: `1px solid ${color}44` }}
            >
              {icon}
            </div>

            {/* Barra + label */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-medium text-[var(--color-ink-2)]">
                  {cat.label}
                </p>
                <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] flex-shrink-0 ml-2">
                  {cat.percentage.toFixed(2)}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barPct}%`, backgroundColor: color, opacity: 0.75 }}
                />
              </div>
            </div>

            {/* Count */}
            <span
              className="text-xs font-semibold font-[var(--font-mono)] tabular-nums w-9 text-right flex-shrink-0"
              style={{ color }}
            >
              {formatNumber(cat.count)}
            </span>
          </div>
        )
      })}

      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] px-1">
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
          Total respuestas
        </p>
        <p className="text-xs font-semibold font-[var(--font-mono)] text-[var(--color-ink)]">
          {formatNumber(data.total)}
        </p>
      </div>
    </div>
  )
}

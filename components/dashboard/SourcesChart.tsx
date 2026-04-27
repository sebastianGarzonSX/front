'use client'

import { useState } from 'react'
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs'
import { formatNumber } from '@/components/dashboard/KPICard'

const COLORS = [
  '#C9973A', '#3DAB6E', '#5C9FD4', '#8B6EBF',
  '#D4875C', '#A07820', '#2D8A5A', '#2A6B9A',
]

type ViewMode = 'attribution' | 'broad'

const SOURCE_TYPE_LABEL: Record<string, string> = {
  ad:    'Anuncio Meta',
  utm:   'Fuente UTM',
  broad: 'Canal GHL',
}

const SOURCE_TYPE_COLOR: Record<string, string> = {
  ad:    'var(--color-gold)',
  utm:   '#5C9FD4',
  broad: 'var(--color-ink-3)',
}

export function SourcesChart() {
  const { data, isLoading } = useDashboardKPIs()
  const [mode, setMode] = useState<ViewMode>('attribution')

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-3 rounded" style={{ width: `${45 + i * 8}%` }} />
            <div className="skeleton h-1.5 flex-1 rounded-full" />
            <div className="skeleton h-3 w-10 rounded" />
          </div>
        ))}
      </div>
    )
  }

  const attrSources = data?.leads.by_attribution ?? []
  const broadSources = data?.leads.by_source ?? []

  const sources = mode === 'attribution' ? attrSources : broadSources
  const total   = sources.reduce((s, r) => s + r.count, 0)
  const max     = Math.max(...sources.map((r) => r.count), 1)

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex gap-1 mb-4">
        {(['attribution', 'broad'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`
              px-2.5 py-1 rounded text-[9px] font-[var(--font-mono)] tracking-wide uppercase transition-all
              ${mode === m
                ? 'bg-[var(--color-surface-2)] border border-[var(--color-border-2)] text-[var(--color-ink)]'
                : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]'}
            `}
          >
            {m === 'attribution' ? 'Por anuncio' : 'Canal GHL'}
          </button>
        ))}
      </div>

      {mode === 'attribution' && (
        <p className="text-[9px] text-[var(--color-ink-3)] font-[var(--font-mono)] mb-3 leading-relaxed">
          Fuente fina: nombre del anuncio Meta cuando existe, si no el canal UTM, si no el campo GHL.
        </p>
      )}

      {sources.length === 0 ? (
        <p className="text-xs text-[var(--color-ink-3)] text-center py-6">Sin datos este mes.</p>
      ) : (
        <div className="space-y-2">
          {sources.map((s, i) => {
            const barPct = Math.round((s.count / max) * 100)
            const pct    = total > 0 ? ((s.count / total) * 100).toFixed(1) : '0'
            const color  = COLORS[i % COLORS.length]
            // source_type solo existe en attribution mode
            const stype  = (s as { source_type?: string }).source_type

            return (
              <div key={`${s.source}-${i}`} className="flex items-center gap-2 group">
                {/* Dot */}
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />

                {/* Source name */}
                <div className="flex items-center gap-1.5 w-40 flex-shrink-0 min-w-0">
                  <p
                    className="text-[11px] text-[var(--color-ink-2)] truncate group-hover:text-[var(--color-ink)] transition-colors"
                    title={s.source}
                  >
                    {s.source}
                  </p>
                  {/* Badge de tipo de fuente */}
                  {stype && (
                    <span
                      className="text-[7px] font-[var(--font-mono)] px-1 py-0.5 rounded flex-shrink-0"
                      style={{
                        color:      SOURCE_TYPE_COLOR[stype] ?? 'var(--color-ink-3)',
                        background: 'var(--color-surface-2)',
                      }}
                    >
                      {SOURCE_TYPE_LABEL[stype] ?? stype}
                    </span>
                  )}
                </div>

                {/* Bar */}
                <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${barPct}%`, background: color }}
                  />
                </div>

                {/* Count + % */}
                <span className="text-[10px] font-[var(--font-mono)] tabular-nums text-[var(--color-ink)] w-8 text-right flex-shrink-0">
                  {formatNumber(s.count)}
                </span>
                <span className="text-[9px] font-[var(--font-mono)] tabular-nums text-[var(--color-ink-3)] w-9 text-right flex-shrink-0">
                  {pct}%
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Leyenda de tipos (solo en modo attribution) */}
      {mode === 'attribution' && attrSources.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-[var(--color-border)]">
          {Object.entries(SOURCE_TYPE_LABEL).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: SOURCE_TYPE_COLOR[key] }} />
              <span className="text-[8px] font-[var(--font-mono)] text-[var(--color-ink-3)]">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

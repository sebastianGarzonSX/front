'use client'

import { useMemo } from 'react'
import { CustomFieldRow } from '@/types'
import { formatNumber } from '@/components/dashboard/KPICard'
import { MessageSquare } from 'lucide-react'

interface FormResponseChartsProps {
  rows:        CustomFieldRow[]
  isLoading:   boolean
  totalLeads?: number
}

interface FieldStat {
  field_name:    string
  respondents:   number
  unique_values: number
  pct:           number
}

function buildFieldStats(rows: CustomFieldRow[], totalLeads: number): FieldStat[] {
  const map = new Map<string, { sum: number; values: Set<string> }>()
  for (const row of rows) {
    const entry = map.get(row.field_name) ?? { sum: 0, values: new Set() }
    entry.sum += row.count
    entry.values.add(row.field_value)
    map.set(row.field_name, entry)
  }
  return [...map.entries()]
    .map(([field_name, { sum, values }]) => ({
      field_name,
      respondents:   sum,
      unique_values: values.size,
      pct:           totalLeads > 0 ? (sum / totalLeads) * 100 : 0,
    }))
    .sort((a, b) => b.respondents - a.respondents)
}

export function FormResponseCharts({ rows, isLoading, totalLeads = 0 }: FormResponseChartsProps) {
  const stats = useMemo(() => buildFieldStats(rows, totalLeads), [rows, totalLeads])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-12 rounded-[var(--radius-sm)]" />
        ))}
      </div>
    )
  }

  if (stats.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-[var(--color-ink-3)]">Sin respuestas de formulario</p>
        <p className="text-[10px] text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">
          Asegurate de sincronizar los custom fields de GHL
        </p>
      </div>
    )
  }

  const maxPct = Math.max(...stats.map((s) => s.pct), 1)

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-1 mb-3">
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
          Pregunta
        </p>
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] text-right">
          Respuestas
        </p>
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] text-right w-14">
          Tasa
        </p>
      </div>

      {/* Filas */}
      {stats.map((s) => {
        const barWidth = maxPct > 0 ? (s.pct / maxPct) * 100 : 0
        const isHigh   = s.pct >= 70
        const isMid    = s.pct >= 40 && s.pct < 70

        return (
          <div
            key={s.field_name}
            className="relative rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden px-3 py-2.5"
          >
            {/* Barra de fondo */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-500"
              style={{
                width:      `${barWidth}%`,
                background: isHigh
                  ? 'var(--color-green)/12'
                  : isMid
                    ? 'var(--color-gold-glow)'
                    : 'var(--color-surface-2)',
                opacity: 0.6,
              }}
            />

            {/* Contenido */}
            <div className="relative grid grid-cols-[1fr_auto_auto] gap-3 items-center">
              {/* Nombre del campo */}
              <div className="flex items-center gap-2 min-w-0">
                <MessageSquare
                  size={12}
                  className="flex-shrink-0 text-[var(--color-ink-3)]"
                />
                <p className="text-xs text-[var(--color-ink)] truncate" title={s.field_name}>
                  {s.field_name}
                </p>
              </div>

              {/* Respondentes + únicos */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-[var(--font-mono)] font-semibold text-[var(--color-ink)] tabular-nums">
                  {formatNumber(s.respondents)}
                </p>
                {s.unique_values > 1 && (
                  <p className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
                    {s.unique_values} distintas
                  </p>
                )}
              </div>

              {/* Tasa */}
              <div className="text-right flex-shrink-0 w-14">
                <p
                  className="text-xs font-[var(--font-mono)] font-semibold tabular-nums"
                  style={{
                    color: isHigh
                      ? 'var(--color-green)'
                      : isMid
                        ? 'var(--color-gold)'
                        : 'var(--color-ink-2)',
                  }}
                >
                  {s.pct.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {totalLeads > 0 && (
        <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] pt-1">
          Tasa calculada sobre {formatNumber(totalLeads)} leads de la clase
        </p>
      )}
    </div>
  )
}

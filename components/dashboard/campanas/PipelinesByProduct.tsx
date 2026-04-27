'use client'

import { AttributionByPipeline } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface PipelinesByProductProps {
  rows: AttributionByPipeline[]
  isLoading: boolean
  canViewFinancials: boolean
}

// Agrupar por pipeline_name
function groupByPipeline(rows: AttributionByPipeline[]) {
  const map = new Map<string, { name: string; stages: AttributionByPipeline[] }>()
  for (const row of rows) {
    const key  = row.pipeline_id
    const name = row.pipeline_name ?? row.pipeline_id
    if (!map.has(key)) map.set(key, { name, stages: [] })
    map.get(key)!.stages.push(row)
  }
  // Ordenar stages por count desc dentro de cada pipeline
  for (const entry of map.values()) {
    entry.stages.sort((a, b) => b.count - a.count)
  }
  return [...map.values()].sort((a, b) => {
    const totalA = a.stages.reduce((s, r) => s + r.count, 0)
    const totalB = b.stages.reduce((s, r) => s + r.count, 0)
    return totalB - totalA
  })
}

const PIPELINE_COLORS = [
  '#C9973A', '#A07820', '#7A5A18',
  '#3DAB6E', '#1E5537', '#2D8A5A',
  '#5C9FD4', '#2A6B9A', '#8B6EBF',
]

interface PipelineCardProps {
  name: string
  stages: AttributionByPipeline[]
  color: string
  canViewFinancials: boolean
  defaultOpen: boolean
}

function PipelineCard({ name, stages, color, canViewFinancials, defaultOpen }: PipelineCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const total = stages.reduce((s, r) => s + r.count, 0)
  const won   = stages.reduce((s, r) => s + r.won, 0)
  const maxCount = Math.max(...stages.map((s) => s.count), 1)

  return (
    <div className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="
          w-full flex items-center justify-between px-4 py-3
          bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] transition-colors
        "
      >
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
          <p className="text-sm font-[var(--font-display)] font-semibold text-[var(--color-ink)] text-left">
            {name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
            {formatNumber(total)} oportunidades
          </span>
          {won > 0 && (
            <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-green)]">
              {won} ganadas
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-[var(--color-ink-3)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Stage list */}
      {open && (
        <div className="px-4 py-3 space-y-2">
          {stages.map((stage) => {
            const barPct = Math.round((stage.count / maxCount) * 100)
            return (
              <div key={stage.stage_name} className="flex items-center gap-3 group">
                {/* Stage name */}
                <p className="text-xs text-[var(--color-ink-2)] w-44 flex-shrink-0 truncate">
                  {stage.stage_name}
                </p>
                {/* Bar */}
                <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barPct}%`, background: color }}
                  />
                </div>
                {/* Count */}
                <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink)] w-8 text-right flex-shrink-0 tabular-nums">
                  {stage.count}
                </span>
                {/* Value */}
                {canViewFinancials && stage.total_value > 0 && (
                  <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] w-24 text-right flex-shrink-0">
                    {formatCurrency(stage.total_value)}
                  </span>
                )}
                {/* Won/Lost badges */}
                <div className="flex gap-1 flex-shrink-0">
                  {stage.won > 0 && (
                    <span className="text-[9px] font-[var(--font-mono)] px-1 py-0.5 rounded bg-[var(--color-green-dim)] text-[var(--color-green)]">
                      +{stage.won}
                    </span>
                  )}
                  {stage.lost > 0 && (
                    <span className="text-[9px] font-[var(--font-mono)] px-1 py-0.5 rounded bg-[var(--color-red-dim)] text-[var(--color-red)]">
                      -{stage.lost}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function PipelinesByProduct({ rows, isLoading, canViewFinancials }: PipelinesByProductProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)]">
              <div className="skeleton h-4 w-40 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-3)] text-center py-8">
        Sin datos de pipeline para el período.
      </p>
    )
  }

  const pipelines = groupByPipeline(rows)

  return (
    <div className="space-y-2">
      {pipelines.map((p, i) => (
        <PipelineCard
          key={p.name}
          name={p.name}
          stages={p.stages}
          color={PIPELINE_COLORS[i % PIPELINE_COLORS.length]}
          canViewFinancials={canViewFinancials}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { AttributionByPipeline } from '@/types'
import { formatNumber, formatCurrency, formatCurrencyDecimal } from '@/components/dashboard/KPICard'

interface PipelineFunnelProps {
  byPipeline:        AttributionByPipeline[]
  isLoading:         boolean
  canViewFinancials: boolean
  totalMetaSpend?:   number
}

const PIPELINE_COLORS = ['#C9973A', '#3DAB6E', '#5C9FD4', '#8B6EBF', '#D4875C', '#A07820']

interface SingleFunnelProps {
  stages:            AttributionByPipeline[]
  color:             string
  canViewFinancials: boolean
  totalMetaSpend:    number
}

function SingleFunnel({ stages, color, canViewFinancials, totalMetaSpend }: SingleFunnelProps) {
  if (stages.length === 0) {
    return <p className="text-xs text-[var(--color-ink-3)] text-center py-8">Sin datos de etapas.</p>
  }

  const maxCount   = Math.max(...stages.map((s) => s.count), 1)
  const firstCount = stages[0]?.count ?? 1
  const totalWon   = stages.reduce((s, r) => s + r.won, 0)
  const totalLost  = stages.reduce((s, r) => s + r.lost, 0)
  const totalValue = stages.reduce((s, r) => s + r.total_value, 0)
  const convPct    = firstCount > 0 ? ((totalWon / firstCount) * 100).toFixed(2) : '0'

  return (
    <div className="space-y-0">
      {stages.map((stage, i) => {
        const barPct  = Math.round((stage.count / maxCount) * 100)
        const pctOfFirst = firstCount > 0 ? Math.round((stage.count / firstCount) * 100) : 0
        const prev    = stages[i - 1]
        const dropPct = prev && prev.count > 0
          ? Math.round(((prev.count - stage.count) / prev.count) * 100)
          : null
        const costPerStage = totalMetaSpend > 0 && stage.count > 0
          ? totalMetaSpend / stage.count
          : null

        return (
          <div key={`${stage.stage_name}-${i}`}>
            {/* Drop-off arrow between stages */}
            {dropPct !== null && (
              <div className="flex items-center gap-2 py-0.5 px-1">
                <div className="w-px h-3 bg-[var(--color-border)] mx-[11px] flex-shrink-0" />
                <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
                  ↓ {dropPct > 0 ? `−${dropPct}%` : 'sin cambio'}
                </span>
              </div>
            )}

            {/* Stage row */}
            <div className="group rounded-[var(--radius-sm)] px-2 py-2 hover:bg-[var(--color-surface-2)] transition-colors">
              {/* Stage name + badges */}
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <p className="text-[11px] text-[var(--color-ink-2)] truncate flex-1" title={stage.stage_name}>
                  {stage.stage_name}
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {stage.won > 0 && (
                    <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-green)]">
                      +{stage.won}
                    </span>
                  )}
                  {stage.lost > 0 && (
                    <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-red)]">
                      −{stage.lost}
                    </span>
                  )}
                </div>
              </div>

              {/* Bar + metrics row */}
              <div className="flex items-center gap-3">
                {/* Visual bar */}
                <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barPct}%`, backgroundColor: color, opacity: 0.7 }}
                  />
                </div>

                {/* Count */}
                <span className="text-xs font-semibold font-[var(--font-mono)] text-[var(--color-ink)] tabular-nums w-10 text-right flex-shrink-0">
                  {formatNumber(stage.count)}
                </span>

                {/* % of total */}
                <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] tabular-nums w-8 text-right flex-shrink-0">
                  {pctOfFirst}%
                </span>

                {/* Cost per stage */}
                {canViewFinancials && (
                  <span className="text-[10px] font-[var(--font-mono)] tabular-nums w-14 text-right flex-shrink-0"
                    style={{ color: costPerStage ? color : 'var(--color-ink-3)' }}>
                    {costPerStage ? formatCurrencyDecimal(costPerStage) : '—'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Column headers (shown below for reference) */}
      <div className="flex items-center gap-3 px-2 pt-2 border-t border-[var(--color-border)] mt-1">
        <div className="flex-1" />
        <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-10 text-right flex-shrink-0">leads</span>
        <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-8 text-right flex-shrink-0">%</span>
        {canViewFinancials && (
          <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-14 text-right flex-shrink-0">c/lead</span>
        )}
      </div>

      {/* Bottom stats */}
      <div className="flex justify-between pt-3 mt-1">
        <div className="text-center">
          <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)]">Conv.</p>
          <p className={`text-sm font-semibold font-[var(--font-mono)] mt-0.5 ${
            parseFloat(convPct) >= 10 ? 'text-[var(--color-green)]'
            : parseFloat(convPct) >= 3 ? 'text-[var(--color-gold)]'
            : 'text-[var(--color-ink-2)]'
          }`}>
            {convPct}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)]">Ganadas</p>
          <p className="text-sm font-semibold font-[var(--font-mono)] mt-0.5 text-[var(--color-green)]">
            {formatNumber(totalWon)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)]">Perdidas</p>
          <p className="text-sm font-semibold font-[var(--font-mono)] mt-0.5 text-[var(--color-red)]">
            {formatNumber(totalLost)}
          </p>
        </div>
        {canViewFinancials && totalValue > 0 && (
          <div className="text-center">
            <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)]">Valor</p>
            <p className="text-sm font-semibold font-[var(--font-mono)] mt-0.5 text-[var(--color-gold)]">
              {formatCurrency(totalValue)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Pipeline grouping ─────────────────────────────────────────────────────────

function groupByPipeline(rows: AttributionByPipeline[]) {
  const map = new Map<string, { id: string; name: string; stages: AttributionByPipeline[] }>()
  for (const row of rows) {
    const key  = row.pipeline_id
    const name = row.pipeline_name ?? row.pipeline_id
    if (!map.has(key)) map.set(key, { id: key, name, stages: [] })
    map.get(key)!.stages.push(row)
  }
  for (const entry of map.values()) {
    entry.stages.sort((a, b) => {
      if (a.stage_position !== b.stage_position) return a.stage_position - b.stage_position
      return b.count - a.count
    })
  }
  return [...map.values()].sort((a, b) => {
    const ta = a.stages.reduce((s, r) => s + r.count, 0)
    const tb = b.stages.reduce((s, r) => s + r.count, 0)
    return tb - ta
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function PipelineFunnel({ byPipeline, isLoading, canViewFinancials, totalMetaSpend = 0 }: PipelineFunnelProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[100, 82, 64, 48, 28].map((pct, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2">
            <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div className="skeleton h-full rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="skeleton h-3 w-8 rounded" />
            <div className="skeleton h-3 w-6 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (byPipeline.length === 0) {
    return <p className="text-xs text-[var(--color-ink-3)] text-center py-8">Sin datos de pipeline para el período.</p>
  }

  const pipelines = groupByPipeline(byPipeline)
  const active    = pipelines[Math.min(activeIdx, pipelines.length - 1)]

  return (
    <div>
      {pipelines.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {pipelines.map((p, i) => {
            const total = p.stages.reduce((s, r) => s + r.count, 0)
            const color = PIPELINE_COLORS[i % PIPELINE_COLORS.length]
            return (
              <button
                key={p.id}
                onClick={() => setActiveIdx(i)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-[var(--font-mono)]
                  border transition-all duration-150
                  ${activeIdx === i
                    ? 'bg-[var(--color-surface-2)] border-[var(--color-border-2)] text-[var(--color-ink)]'
                    : 'border-transparent text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]'}
                `}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color, opacity: activeIdx === i ? 1 : 0.4 }} />
                <span className="truncate max-w-[100px]" title={p.name}>{p.name}</span>
                <span className="opacity-50">{formatNumber(total)}</span>
              </button>
            )
          })}
        </div>
      )}

      <SingleFunnel
        stages={active.stages}
        color={PIPELINE_COLORS[activeIdx % PIPELINE_COLORS.length]}
        canViewFinancials={canViewFinancials}
        totalMetaSpend={totalMetaSpend}
      />
    </div>
  )
}

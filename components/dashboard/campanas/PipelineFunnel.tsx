'use client'

import { useState } from 'react'
import { AttributionByPipeline } from '@/types'
import { formatNumber, formatCurrency } from '@/components/dashboard/KPICard'

interface PipelineFunnelProps {
  byPipeline: AttributionByPipeline[]
  isLoading: boolean
  canViewFinancials: boolean
}

// ── SVG Funnel for one pipeline ───────────────────────────────────────────────

const CHART_W   = 340
const BAR_H     = 40
const GAP_H     = 18   // gap between bars (room for drop-off label)
const MIN_BAR_W = 20

const PIPELINE_COLORS = ['#C9973A', '#3DAB6E', '#5C9FD4', '#8B6EBF', '#D4875C', '#A07820']

interface SingleFunnelProps {
  name:              string
  stages:            AttributionByPipeline[]
  color:             string
  canViewFinancials: boolean
}

function SingleFunnel({ name: _name, stages, color, canViewFinancials }: SingleFunnelProps) {
  if (stages.length === 0) {
    return <p className="text-xs text-[var(--color-ink-3)] text-center py-8">Sin datos de etapas.</p>
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1)
  const svgH     = stages.length * BAR_H + Math.max(0, stages.length - 1) * GAP_H

  const totalWon   = stages.reduce((s, r) => s + r.won,         0)
  const totalLost  = stages.reduce((s, r) => s + r.lost,        0)
  const totalValue = stages.reduce((s, r) => s + r.total_value, 0)
  const firstCount = stages[0]?.count ?? 1
  const convPct    = firstCount > 0 ? Math.round((totalWon / firstCount) * 100) : 0

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${CHART_W} ${svgH}`}
        style={{ overflow: 'visible', display: 'block' }}
        aria-label={`Funnel ${_name}`}
      >
        <defs>
          <linearGradient id={`fg-${color.slice(1)}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={color} stopOpacity="0.15" />
            <stop offset="50%"  stopColor={color} stopOpacity="0.5"  />
            <stop offset="100%" stopColor={color} stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {stages.map((stage, i) => {
          const barW  = Math.max((stage.count / maxCount) * CHART_W, MIN_BAR_W)
          const barX  = (CHART_W - barW) / 2
          const barY  = i * (BAR_H + GAP_H)
          const prev  = stages[i - 1]
          const dropN = prev ? prev.count - stage.count : null
          const dropP = (prev && prev.count > 0)
            ? Math.round((dropN! / prev.count) * 100)
            : null

          // fade opacity as funnel narrows
          const opacity = 1 - (i / stages.length) * 0.45

          return (
            <g key={`s-${stage.stage_name}-${i}`}>
              {/* Drop label between bars */}
              {dropP !== null && (
                <text
                  x={CHART_W / 2}
                  y={barY - GAP_H / 2 + 3}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#5C5650"
                  fontFamily="'JetBrains Mono', 'Courier New', monospace"
                  letterSpacing="0.04em"
                >
                  {dropN! > 0 ? `↓ −${dropP}% (${dropN} menos)` : '→ sin variación'}
                </text>
              )}

              {/* Track (full-width background) */}
              <rect x={0} y={barY} width={CHART_W} height={BAR_H} rx={3} fill="#161616" />

              {/* Filled bar */}
              <rect
                x={barX}
                y={barY}
                width={barW}
                height={BAR_H}
                rx={3}
                fill={`url(#fg-${color.slice(1)})`}
                stroke={color}
                strokeWidth={0.6}
                strokeOpacity={opacity}
              />

              {/* Stage name — left aligned inside bar or outside if too narrow */}
              <text
                x={barW > 120 ? barX + 8 : CHART_W / 2}
                y={barY + BAR_H / 2 - 5}
                fontSize="8"
                fill="#9A9088"
                textAnchor={barW > 120 ? 'start' : 'middle'}
                fontFamily="'JetBrains Mono', 'Courier New', monospace"
              >
                {stage.stage_name.length > 22 ? stage.stage_name.slice(0, 20) + '…' : stage.stage_name}
              </text>

              {/* Count — right aligned */}
              <text
                x={CHART_W / 2 + barW / 2 - 8}
                y={barY + BAR_H / 2 + 10}
                fontSize="13"
                fontWeight="700"
                fill="#F2EDE8"
                textAnchor="end"
                fontFamily="Georgia, serif"
              >
                {formatNumber(stage.count)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Bottom stats strip */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex justify-between">
        <div className="text-center">
          <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-[0.14em] text-[var(--color-ink-3)]">
            Tasa conv.
          </p>
          <p className={`text-sm font-semibold font-[var(--font-mono)] mt-0.5 ${
            convPct >= 10 ? 'text-[var(--color-green)]' : convPct >= 5 ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-2)]'
          }`}>
            {convPct}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-[0.14em] text-[var(--color-ink-3)]">
            Ganadas
          </p>
          <p className="text-sm font-semibold font-[var(--font-mono)] mt-0.5 text-[var(--color-green)]">
            {formatNumber(totalWon)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-[0.14em] text-[var(--color-ink-3)]">
            Perdidas
          </p>
          <p className="text-sm font-semibold font-[var(--font-mono)] mt-0.5 text-[var(--color-red)]">
            {formatNumber(totalLost)}
          </p>
        </div>
        {canViewFinancials && (
          <div className="text-center">
            <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-[0.14em] text-[var(--color-ink-3)]">
              Valor pipeline
            </p>
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
    // Sort by stage_position first, fall back to count DESC
    entry.stages.sort((a, b) => {
      if (a.stage_position !== b.stage_position) return a.stage_position - b.stage_position
      return b.count - a.count
    })
  }
  // Sort pipelines by total opps descending
  return [...map.values()].sort((a, b) => {
    const ta = a.stages.reduce((s, r) => s + r.count, 0)
    const tb = b.stages.reduce((s, r) => s + r.count, 0)
    return tb - ta
  })
}

// ── Main exported component ───────────────────────────────────────────────────

export function PipelineFunnel({ byPipeline, isLoading, canViewFinancials }: PipelineFunnelProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          {[80, 100, 90].map((w, i) => <div key={i} className="skeleton h-6 rounded-full" style={{ width: w }} />)}
        </div>
        <div className="space-y-2 pt-2">
          {[100, 82, 64, 48, 28].map((pct, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="skeleton h-10 rounded" style={{ width: `${pct}%` }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (byPipeline.length === 0) {
    return <p className="text-xs text-[var(--color-ink-3)] text-center py-8">Sin datos de pipeline para el período.</p>
  }

  const pipelines = groupByPipeline(byPipeline)
  const active    = pipelines[activeIdx] ?? pipelines[0]

  return (
    <div>
      {/* Pipeline tab selector */}
      {pipelines.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {pipelines.map((p, i) => {
            const total = p.stages.reduce((s, r) => s + r.count, 0)
            const color = PIPELINE_COLORS[i % PIPELINE_COLORS.length]
            return (
              <button
                key={p.id}
                onClick={() => setActiveIdx(i)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-[var(--font-mono)]
                  transition-all duration-150
                  ${activeIdx === i
                    ? 'bg-[var(--color-surface-2)] border border-[var(--color-border-2)] text-[var(--color-ink)]'
                    : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]'}
                `}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color, opacity: activeIdx === i ? 1 : 0.5 }}
                />
                <span className="truncate max-w-[120px]" title={p.name}>{p.name}</span>
                <span className="opacity-50">{formatNumber(total)}</span>
              </button>
            )
          })}
        </div>
      )}

      <SingleFunnel
        name={active.name}
        stages={active.stages}
        color={PIPELINE_COLORS[activeIdx % PIPELINE_COLORS.length]}
        canViewFinancials={canViewFinancials}
      />
    </div>
  )
}

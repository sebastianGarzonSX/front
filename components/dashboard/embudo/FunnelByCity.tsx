'use client'

import { FunnelByCityResponse, FunnelStageKey, PipelineType } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

// ── Colores por etapa ─────────────────────────────────────────────────────────

const STAGE_META: Record<FunnelStageKey, { color: string; label: string; icon: string }> = {
  cold:       { color: '#5C5650', label: 'Lead frío',         icon: '●' },
  interacted: { color: '#5C9FD4', label: 'Interactuó',        icon: '◆' },
  survey:     { color: '#8B6EBF', label: 'Primera pregunta',  icon: '▲' },
  decision:   { color: '#C9973A', label: 'Toma de decisión',  icon: '◈' },
  payment:    { color: '#D4875C', label: 'Solicitud de pago', icon: '◉' },
  won:        { color: '#3DAB6E', label: 'Venta realizada',   icon: '★' },
}

interface PipelineToggleProps {
  value:    PipelineType
  onChange: (v: PipelineType) => void
}

export function PipelineTypeToggle({ value, onChange }: PipelineToggleProps) {
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
      {(['registro', 'venta'] as PipelineType[]).map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`
            px-3 py-1 rounded-sm text-[10px] font-[var(--font-mono)] uppercase tracking-wider
            transition-all duration-150
            ${value === type
              ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm'
              : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]'}
          `}
        >
          {type === 'registro' ? 'Registro' : 'Venta'}
        </button>
      ))}
    </div>
  )
}

// ── Funnel visual ─────────────────────────────────────────────────────────────

interface FunnelByCityProps {
  data:              FunnelByCityResponse | null
  isLoading:         boolean
  canViewFinancials: boolean
}

export function FunnelByCity({ data, isLoading, canViewFinancials }: FunnelByCityProps) {
  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {[100, 78, 58, 42, 24, 12].map((pct, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="flex-1 h-11 skeleton rounded-[var(--radius-sm)]" style={{ maxWidth: `${pct}%` }} />
            <div className="skeleton h-4 w-12 rounded" />
            <div className="skeleton h-4 w-8 rounded" />
            <div className="skeleton h-4 w-14 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!data || data.stages.length === 0) {
    return (
      <div className="py-14 flex flex-col items-center gap-2">
        <p className="text-sm text-[var(--color-ink-2)]">Sin datos de embudo para esta selección.</p>
        <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
          Seleccioná una ciudad y un rango de fechas
        </p>
      </div>
    )
  }

  const maxCount   = Math.max(...data.stages.map((s) => s.count), 1)
  const firstCount = data.stages[0]?.count ?? 1

  return (
    <div>
      {/* Totales resumen */}
      <div className="flex items-center gap-6 px-2 py-3 mb-3 border-b border-[var(--color-border)]">
        <div>
          <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">Total leads</p>
          <p className="text-lg font-semibold font-[var(--font-display)] text-[var(--color-ink)] tabular-nums">
            {formatNumber(data.total_leads)}
          </p>
        </div>
        {canViewFinancials && data.meta_spend > 0 && (
          <div>
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">Gasto Meta</p>
            <p className="text-lg font-semibold font-[var(--font-display)] text-[var(--color-gold)] tabular-nums">
              {formatCurrency(data.meta_spend)}
            </p>
          </div>
        )}
        {canViewFinancials && data.meta_spend > 0 && data.total_leads > 0 && (
          <div>
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">CPL total</p>
            <p className="text-lg font-semibold font-[var(--font-display)] text-[var(--color-ink)] tabular-nums">
              {formatCurrency(data.meta_spend / data.total_leads)}
            </p>
          </div>
        )}
      </div>

      {/* Columnas header */}
      <div className="flex items-center gap-2 px-2 mb-1">
        <div className="flex-1" />
        <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-11 text-right flex-shrink-0">leads</span>
        <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-9 text-right flex-shrink-0">%</span>
        {canViewFinancials && (
          <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-16 text-right flex-shrink-0">c/lead</span>
        )}
      </div>

      {/* Etapas */}
      <div className="space-y-0">
        {data.stages.map((stage, i) => {
          const meta       = STAGE_META[stage.stage_key] ?? { color: '#C9973A', label: stage.stage_name, icon: '●' }
          const barPct     = Math.round((stage.count / maxCount) * 100)
          const pctOfFirst = firstCount > 0 ? Math.round((stage.count / firstCount) * 100) : 0
          const prev       = data.stages[i - 1]
          const dropPct    = prev && prev.count > 0
            ? Math.round(((prev.count - stage.count) / prev.count) * 100)
            : null

          return (
            <div key={stage.stage_key}>
              {/* Drop connector */}
              {dropPct !== null && (
                <div className="flex items-center gap-2 py-0.5 pl-3">
                  <div
                    className="w-px h-3 flex-shrink-0"
                    style={{ background: `${meta.color}66` }}
                  />
                  <span className={`
                    text-[9px] font-[var(--font-mono)]
                    ${dropPct > 50 ? 'text-[var(--color-red)]'
                      : dropPct > 25 ? 'text-[var(--color-gold)]'
                      : 'text-[var(--color-ink-3)]'}
                  `}>
                    ↓ {dropPct > 0 ? `−${dropPct}%` : 'sin caída'}
                  </span>
                </div>
              )}

              {/* Stage row */}
              <div className="group flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-2)] transition-colors">
                {/* Icono de etapa */}
                <span
                  className="text-[11px] w-4 flex-shrink-0 text-center"
                  style={{ color: meta.color }}
                >
                  {meta.icon}
                </span>

                {/* Barra */}
                <div className="flex-1 relative h-9 bg-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden">
                  <div
                    className="h-full rounded-[var(--radius-sm)] transition-all duration-700"
                    style={{ width: `${barPct}%`, backgroundColor: meta.color, opacity: 0.55 }}
                  />
                  <div className="absolute inset-0 flex items-center px-2.5 gap-2">
                    <span className="text-[10px] font-medium text-[var(--color-ink)] truncate">
                      {stage.stage_name || meta.label}
                    </span>
                  </div>
                </div>

                {/* Count */}
                <span
                  className="text-xs font-semibold font-[var(--font-mono)] tabular-nums w-11 text-right flex-shrink-0"
                  style={{ color: meta.color }}
                >
                  {formatNumber(stage.count)}
                </span>

                {/* % del total */}
                <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] tabular-nums w-9 text-right flex-shrink-0">
                  {pctOfFirst}%
                </span>

                {/* Costo por lead */}
                {canViewFinancials && (
                  <span
                    className="text-[10px] font-[var(--font-mono)] tabular-nums w-16 text-right flex-shrink-0"
                    style={{ color: stage.cost_per_lead ? meta.color : 'var(--color-ink-3)' }}
                  >
                    {stage.cost_per_lead ? formatCurrency(stage.cost_per_lead) : '—'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tasa de conversión final */}
      {data.stages.length > 0 && (() => {
        const lastStage  = data.stages[data.stages.length - 1]
        const convRate   = firstCount > 0 ? ((lastStage.count / firstCount) * 100).toFixed(1) : '0'
        const wonMeta    = STAGE_META.won
        return (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-3 px-2">
            <span className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
              Tasa de conversión
            </span>
            <span
              className="text-sm font-semibold font-[var(--font-mono)] tabular-nums"
              style={{ color: parseFloat(convRate) >= 5 ? wonMeta.color : 'var(--color-gold)' }}
            >
              {convRate}%
            </span>
            <span className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)]">
              ({formatNumber(lastStage.count)} ventas / {formatNumber(firstCount)} leads)
            </span>
          </div>
        )
      })()}
    </div>
  )
}

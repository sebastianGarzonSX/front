'use client'

import { ClaseReport, MetaCampaignRow } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

interface ConversionFunnelLinearProps {
  report:    ClaseReport | null
  meta:      MetaCampaignRow | null
  isLoading: boolean
}

const STAGE_COLORS: Record<string, string> = {
  api:                       '#6B7280',
  Registro:                  '#C9973A',
  'Contactado - CTA agenda': '#D4A054',
  'Solicito agenda':         '#5C9FD4',
  Agendo:                    '#4A8BC2',
  'Asistio Sesión':          '#8B6EBF',
  Compra:                    '#3DAB6E',
  'Pendiente pago':          '#E6A23C',
  Desiste:                   '#EF4444',
  'Ya es cliente':           '#10B981',
}

const STAGE_LABELS: Record<string, string> = {
  api:                       'Ingreso automático',
  Registro:                  'Registro',
  'Contactado - CTA agenda': 'Contactado',
  'Solicito agenda':         'Solicitó agenda',
  Agendo:                    'Agendó sesión',
  'Asistio Sesión':          'Asistió a sesión',
  Compra:                    'Compra',
  'Pendiente pago':          'Pendiente de pago',
  Desiste:                   'Desiste',
  'Ya es cliente':           'Ya es cliente',
}

const EXCLUDE_STAGES = new Set(['Desiste'])

export function ConversionFunnelLinear({ report, meta, isLoading }: ConversionFunnelLinearProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[100, 85, 60, 40, 25, 15].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-10 rounded flex-1" style={{ maxWidth: `${w}%` }} />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (!report) {
    return <p className="text-xs text-[var(--color-ink-3)] text-center py-8">Seleccioná una clase para ver el funnel.</p>
  }

  const spend = meta?.spend ?? 0
  const funnel = report.pipeline_funnel ?? []

  // Build cumulative steps: each stage shows leads that reached AT LEAST that stage
  const sortedStages = [...funnel]
    .filter(s => !EXCLUDE_STAGES.has(s.stage_name))
    .sort((a, b) => a.position - b.position)

  // Cumulative: leads "at or beyond" each stage
  const cumulativeSteps = sortedStages.map((stage, i) => {
    const atOrBeyond = sortedStages
      .filter((_, j) => j >= i)
      .reduce((sum, s) => sum + s.count, 0)
    return {
      ...stage,
      cumulative: atOrBeyond,
    }
  })

  // First step = total leads (from tag, includes leads without opportunity)
  const steps = [
    {
      label: 'Leads totales',
      count: report.total_leads,
      color: '#C9973A',
      isTotal: true,
    },
    ...cumulativeSteps.map(s => ({
      label: STAGE_LABELS[s.stage_name] ?? s.stage_name,
      count: s.cumulative,
      color: STAGE_COLORS[s.stage_name] ?? '#6B7280',
      isTotal: false,
      raw: s.count,
      stageName: s.stage_name,
    })),
  ]

  const maxCount = Math.max(...steps.map(s => s.count), 1)
  const firstCount = steps[0]?.count ?? 1

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const barPct   = Math.max(Math.round((step.count / maxCount) * 100), step.count > 0 ? 3 : 0)
        const pctFirst = firstCount > 0 ? Math.round((step.count / firstCount) * 100) : 0
        const prev     = steps[i - 1]
        const dropPct  = prev && prev.count > 0
          ? Math.round(((prev.count - step.count) / prev.count) * 100)
          : null
        const costPer  = spend > 0 && step.count > 0 ? spend / step.count : undefined

        return (
          <div key={step.label}>
            {dropPct !== null && dropPct > 0 && (
              <div className="flex items-center gap-2 py-0.5 pl-3">
                <div className="w-px h-3 bg-[var(--color-border)] flex-shrink-0" />
                <span className={`text-[9px] font-[var(--font-mono)] ${dropPct > 50 ? 'text-[var(--color-red)]' : dropPct > 25 ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-3)]'}`}>
                  ↓ −{dropPct}%
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 group rounded-[var(--radius-sm)] px-2 py-2 hover:bg-[var(--color-surface-2)] transition-colors">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                style={{ background: step.color + '33', color: step.color }}
              >
                {i + 1}
              </div>

              <div className="flex-1 relative h-7 bg-[var(--color-border)] rounded-[var(--radius-sm)] overflow-hidden">
                <div
                  className="h-full rounded-[var(--radius-sm)] transition-all duration-700"
                  style={{ width: `${barPct}%`, backgroundColor: step.color, opacity: 0.65 }}
                />
                <div className="absolute inset-0 flex items-center px-2.5">
                  <span className="text-[11px] font-medium text-[var(--color-ink)] truncate">
                    {step.label}
                  </span>
                </div>
              </div>

              <span className="text-sm font-semibold font-[var(--font-mono)] text-[var(--color-ink)] tabular-nums w-12 text-right flex-shrink-0">
                {formatNumber(step.count)}
              </span>

              <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] tabular-nums w-10 text-right flex-shrink-0">
                {pctFirst}%
              </span>

              <span className="text-[10px] font-[var(--font-mono)] tabular-nums w-16 text-right flex-shrink-0"
                style={{ color: costPer ? step.color : 'var(--color-ink-3)' }}>
                {costPer ? formatCurrency(costPer) : '—'}
              </span>
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-3 px-2 pt-3 border-t border-[var(--color-border)] mt-1">
        <div className="w-5 flex-shrink-0" />
        <div className="flex-1" />
        <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-12 text-right flex-shrink-0">total</span>
        <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-10 text-right flex-shrink-0">% del total</span>
        <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-16 text-right flex-shrink-0">costo/lead</span>
      </div>
    </div>
  )
}

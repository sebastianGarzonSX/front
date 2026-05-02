'use client'

import { ClaseReport, MetaCampaignRow } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

interface ConversionFunnelLinearProps {
  report:    ClaseReport | null
  meta:      MetaCampaignRow | null
  isLoading: boolean
}

interface FunnelStep {
  label:   string
  count:   number
  color:   string
  cost?:   number
}

export function ConversionFunnelLinear({ report, meta, isLoading }: ConversionFunnelLinearProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[100, 75, 55, 35, 15].map((w, i) => (
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

  const spend     = meta?.spend ?? 0
  const lmTotal   = report.lm_dist.reduce((s, r) => s + r.count, 0)

  const steps: FunnelStep[] = [
    {
      label: 'Leads en CRM',
      count: report.total_leads,
      color: '#C9973A',
      cost:  spend > 0 && report.total_leads > 0 ? spend / report.total_leads : undefined,
    },
    {
      label: 'Lead Magnet',
      count: lmTotal,
      color: '#5C9FD4',
      cost:  spend > 0 && lmTotal > 0 ? spend / lmTotal : undefined,
    },
    {
      label: 'Sesión agendada',
      count: report.sessions,
      color: '#8B6EBF',
      cost:  spend > 0 && report.sessions > 0 ? spend / report.sessions : undefined,
    },
    {
      label: 'Compra realizada',
      count: report.purchases,
      color: '#3DAB6E',
      cost:  spend > 0 && report.purchases > 0 ? spend / report.purchases : undefined,
    },
  ]

  const maxCount = Math.max(...steps.map((s) => s.count), 1)
  const firstCount = steps[0]?.count ?? 1

  return (
    <div className="space-y-1">
      {steps.map((step, i) => {
        const barPct   = Math.round((step.count / maxCount) * 100)
        const pctFirst = firstCount > 0 ? Math.round((step.count / firstCount) * 100) : 0
        const prev     = steps[i - 1]
        const dropPct  = prev && prev.count > 0
          ? Math.round(((prev.count - step.count) / prev.count) * 100)
          : null

        return (
          <div key={step.label}>
            {dropPct !== null && (
              <div className="flex items-center gap-2 py-1 pl-3">
                <div className="w-px h-4 bg-[var(--color-border)] flex-shrink-0" />
                <span className={`text-[9px] font-[var(--font-mono)] ${dropPct > 50 ? 'text-[var(--color-red)]' : dropPct > 25 ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-3)]'}`}>
                  ↓ {dropPct > 0 ? `−${dropPct}% caída` : 'sin caída'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 group rounded-[var(--radius-sm)] px-2 py-2.5 hover:bg-[var(--color-surface-2)] transition-colors">
              {/* Step number */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold"
                style={{ background: step.color + '33', color: step.color }}
              >
                {i + 1}
              </div>

              {/* Bar */}
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

              {/* Count */}
              <span className="text-sm font-semibold font-[var(--font-mono)] text-[var(--color-ink)] tabular-nums w-12 text-right flex-shrink-0">
                {formatNumber(step.count)}
              </span>

              {/* % of first */}
              <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] tabular-nums w-8 text-right flex-shrink-0">
                {pctFirst}%
              </span>

              {/* Cost per step */}
              <span className="text-[10px] font-[var(--font-mono)] tabular-nums w-16 text-right flex-shrink-0"
                style={{ color: step.cost ? step.color : 'var(--color-ink-3)' }}>
                {step.cost ? formatCurrency(step.cost) : '—'}
              </span>
            </div>
          </div>
        )
      })}

      {/* Column legend */}
      <div className="flex items-center gap-3 px-2 pt-3 border-t border-[var(--color-border)] mt-1">
        <div className="w-5 flex-shrink-0" />
        <div className="flex-1" />
        <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-12 text-right flex-shrink-0">total</span>
        <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-8 text-right flex-shrink-0">%</span>
        <span className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] w-16 text-right flex-shrink-0">c/lead</span>
      </div>
    </div>
  )
}

'use client'

import { TrafficKPIsResponse } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

interface TrafficComparisonProps {
  data:              TrafficKPIsResponse | null
  isLoading:         boolean
  canViewFinancials: boolean
}

function StatCell({
  label,
  value,
  sub,
  accent,
}: {
  label:   string
  value:   string
  sub?:    string
  accent?: string
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
        {label}
      </p>
      <p
        className="text-lg font-semibold font-[var(--font-display)] tabular-nums"
        style={{ color: accent ?? 'var(--color-ink)' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)]">{sub}</p>
      )}
    </div>
  )
}

export function TrafficComparison({ data, isLoading, canViewFinancials }: TrafficComparisonProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="skeleton h-44 rounded-[var(--radius-md)]" />
        <div className="skeleton h-44 rounded-[var(--radius-md)]" />
        <div className="skeleton h-44 rounded-[var(--radius-md)]" />
      </div>
    )
  }

  if (!data) {
    return (
      <p className="text-sm text-[var(--color-ink-3)] text-center py-10">
        Sin datos de tráfico para el período seleccionado.
      </p>
    )
  }

  const gapColor =
    data.variation_pct > 40 ? 'var(--color-red)'
    : data.variation_pct > 20 ? 'var(--color-gold)'
    : 'var(--color-green)'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

      {/* Panel Meta */}
      <div className="p-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1877F2]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">Meta Ads</p>
          <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] ml-auto">datos nativos</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <StatCell label="Leads" value={formatNumber(data.meta_leads)} />
          {canViewFinancials && (
            <StatCell label="CPL" value={data.meta_cpl > 0 ? formatCurrency(data.meta_cpl) : '—'} />
          )}
          {canViewFinancials && (
            <StatCell label="CPC" value={data.meta_cpc > 0 ? formatCurrency(data.meta_cpc) : '—'} />
          )}
          <StatCell
            label="CTR"
            value={data.meta_ctr > 0 ? `${data.meta_ctr.toFixed(2)}%` : '—'}
          />
          <StatCell
            label="Impresiones"
            value={formatNumber(data.meta_impressions)}
          />
          {canViewFinancials && (
            <StatCell
              label="Gasto"
              value={data.meta_spend > 0 ? formatCurrency(data.meta_spend) : '—'}
              accent="var(--color-gold)"
            />
          )}
        </div>
      </div>

      {/* Panel Variación central */}
      <div className="
        p-5 rounded-[var(--radius-md)] border bg-[var(--color-surface-2)]
        flex flex-col items-center justify-center gap-3 text-center
      "
        style={{ borderColor: gapColor + '44' }}
      >
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
          Variación Meta vs CRM
        </p>
        <div
          className="text-4xl font-[var(--font-display)] font-bold tabular-nums"
          style={{ color: gapColor }}
        >
          {data.variation_pct > 0 ? '+' : ''}{data.variation_pct.toFixed(0)}%
        </div>
        <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
          Meta reporta{' '}
          <span className="font-semibold" style={{ color: gapColor }}>
            {formatNumber(Math.abs(data.variation_absolute))} leads {data.variation_absolute > 0 ? 'más' : 'menos'}
          </span>{' '}
          que el CRM
        </p>
        <div
          className="mt-1 px-3 py-1 rounded-full text-[10px] font-[var(--font-mono)]"
          style={{
            background: gapColor + '1A',
            color: gapColor,
            border: `1px solid ${gapColor}44`,
          }}
        >
          {data.variation_pct > 40
            ? 'Inflación alta — revisar campañas'
            : data.variation_pct > 20
            ? 'Diferencia moderada'
            : 'Diferencia normal'}
        </div>
      </div>

      {/* Panel CRM */}
      <div className="p-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--color-gold)]" />
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">CRM (GHL)</p>
          <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] ml-auto">leads reales</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <StatCell
            label="Leads CRM"
            value={formatNumber(data.crm_leads)}
            accent="var(--color-gold)"
          />
          {canViewFinancials && (
            <StatCell
              label="CPL real"
              value={data.crm_cpl > 0 ? formatCurrency(data.crm_cpl) : '—'}
              sub={data.meta_spend > 0 ? `gasto ÷ ${data.crm_leads} leads` : 'sin gasto Meta'}
            />
          )}
        </div>

        {canViewFinancials && data.meta_spend > 0 && data.crm_leads > 0 && (
          <div className="pt-3 border-t border-[var(--color-border)]">
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-1.5">
              Fórmula CPL real
            </p>
            <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-2)]">
              {formatCurrency(data.meta_spend)} ÷ {formatNumber(data.crm_leads)} = <span className="text-[var(--color-gold)]">{formatCurrency(data.crm_cpl)}</span>
            </p>
          </div>
        )}
      </div>

    </div>
  )
}

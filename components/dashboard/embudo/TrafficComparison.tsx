'use client'

import { TrafficKPIsResponse } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

interface TrafficComparisonProps {
  data:              TrafficKPIsResponse | null
  isLoading:         boolean
  canViewFinancials: boolean
}

interface KpiCardProps {
  label:  string
  value:  string
  sub?:   string
  color:  string
  icon:   string
}

function KpiCard({ label, value, sub, color, icon }: KpiCardProps) {
  return (
    <div
      className="relative p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-1 overflow-hidden"
      style={{ borderTopColor: color, borderTopWidth: 2 }}
    >
      <div
        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-sm"
        style={{ background: color + '22', color }}
      >
        {icon}
      </div>
      <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] pr-8">
        {label}
      </p>
      <p className="text-xl font-semibold font-[var(--font-display)] tabular-nums leading-none mt-1" style={{ color }}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)] mt-0.5 leading-snug">{sub}</p>
      )}
      <div
        className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${color}0D, transparent)` }}
      />
    </div>
  )
}

export function TrafficComparison({ data, isLoading, canViewFinancials }: TrafficComparisonProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-[var(--radius-md)]" />
          ))}
        </div>
        <div className="skeleton h-24 rounded-[var(--radius-md)]" />
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
    data.variation_pct > 40 ? '#EF4444'
    : data.variation_pct > 20 ? '#F59E0B'
    : '#10B981'

  return (
    <div className="space-y-3">

      {/* Meta Ads cards */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-[#1877F2]" />
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">Meta Ads</p>
        <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] ml-1">datos nativos</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard
          label="Leads Meta"
          value={formatNumber(data.meta_leads)}
          sub="leads pixel"
          color="#1877F2"
          icon="↗"
        />
        {canViewFinancials && (
          <KpiCard
            label="Gasto"
            value={data.meta_spend > 0 ? formatCurrency(data.meta_spend) : '—'}
            sub={data.meta_impressions > 0 ? `${formatNumber(data.meta_impressions)} impr.` : undefined}
            color="#F59E0B"
            icon="$"
          />
        )}
        {canViewFinancials && (
          <KpiCard
            label="CPL"
            value={data.meta_cpl > 0 ? formatCurrency(data.meta_cpl) : '—'}
            sub="costo por lead"
            color="#8B5CF6"
            icon="÷"
          />
        )}
        {canViewFinancials && (
          <KpiCard
            label="CPC"
            value={data.meta_cpc > 0 ? formatCurrency(data.meta_cpc) : '—'}
            sub="costo por clic"
            color="#06B6D4"
            icon="⌖"
          />
        )}
        <KpiCard
          label="CTR"
          value={data.meta_ctr > 0 ? `${data.meta_ctr.toFixed(2)}%` : '—'}
          sub="clics / impresiones"
          color="#10B981"
          icon="%"
        />
      </div>

      {/* Variación + CRM */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Variación central */}
        <div
          className="p-4 rounded-[var(--radius-md)] border bg-[var(--color-surface-2)] flex flex-col items-center justify-center gap-2 text-center"
          style={{ borderColor: gapColor + '55', borderTopColor: gapColor, borderTopWidth: 2 }}
        >
          <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
            Variación Meta vs CRM
          </p>
          <div className="text-4xl font-[var(--font-display)] font-bold tabular-nums" style={{ color: gapColor }}>
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
            className="px-3 py-1 rounded-full text-[10px] font-[var(--font-mono)]"
            style={{ background: gapColor + '1A', color: gapColor, border: `1px solid ${gapColor}44` }}
          >
            {data.variation_pct > 40 ? 'Inflación alta — revisar campañas'
              : data.variation_pct > 20 ? 'Diferencia moderada'
              : 'Diferencia normal'}
          </div>
        </div>

        {/* CRM */}
        <div
          className="sm:col-span-2 p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          style={{ borderTopColor: '#F59E0B', borderTopWidth: 2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[var(--color-gold)]" />
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)]">CRM (GHL)</p>
            <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] ml-auto">leads reales</span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-0.5">
              <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">Leads CRM</p>
              <p className="text-2xl font-semibold font-[var(--font-display)] tabular-nums leading-none" style={{ color: '#F59E0B' }}>
                {formatNumber(data.crm_leads)}
              </p>
              <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)]">leads reales CRM</p>
            </div>
            {canViewFinancials && (
              <div className="space-y-0.5">
                <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">CPL real</p>
                <p className="text-2xl font-semibold font-[var(--font-display)] tabular-nums leading-none" style={{ color: '#8B5CF6' }}>
                  {data.crm_cpl > 0 ? formatCurrency(data.crm_cpl) : '—'}
                </p>
                <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)]">
                  {data.meta_spend > 0 ? `gasto ÷ ${data.crm_leads} leads` : 'sin gasto Meta'}
                </p>
              </div>
            )}
          </div>

          {canViewFinancials && data.meta_spend > 0 && data.crm_leads > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-1">Fórmula CPL real</p>
              <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-2)]">
                {formatCurrency(data.meta_spend)} ÷ {formatNumber(data.crm_leads)} ={' '}
                <span style={{ color: '#8B5CF6' }}>{formatCurrency(data.crm_cpl)}</span>
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

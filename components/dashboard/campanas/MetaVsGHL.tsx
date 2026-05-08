'use client'

import { MetaCampaignRow, ClaseReport } from '@/types'
import { formatCurrency, formatCurrencyDecimal, formatNumber } from '@/components/dashboard/KPICard'

interface MetaVsGHLProps {
  report:    ClaseReport | null
  meta:      MetaCampaignRow | null
  isLoading: boolean
}

interface KpiCardProps {
  label:   string
  value:   string
  sub?:    string
  color:   string   // hex
  icon:    string
}

function KpiCard({ label, value, sub, color, icon }: KpiCardProps) {
  return (
    <div
      className="relative p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-1 overflow-hidden"
      style={{ borderTopColor: color, borderTopWidth: 2 }}
    >
      {/* Icon badge */}
      <div
        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-sm"
        style={{ background: color + '22', color }}
      >
        {icon}
      </div>

      <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] pr-8">
        {label}
      </p>
      <p
        className="text-2xl font-semibold font-[var(--font-display)] tabular-nums leading-none mt-1"
        style={{ color }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)] mt-0.5 leading-snug">
          {sub}
        </p>
      )}

      {/* Subtle glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${color}0D, transparent)` }}
      />
    </div>
  )
}

export function MetaVsGHL({ report, meta, isLoading }: MetaVsGHLProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-[var(--radius-md)]" />
          ))}
        </div>
        <div className="skeleton h-28 rounded-[var(--radius-md)]" />
      </div>
    )
  }

  const spend       = meta?.spend       ?? 0
  const impressions = meta?.impressions ?? 0
  const metaLeads   = meta?.conversions ?? 0
  const ghlLeads    = report?.total_leads ?? 0
  const cpm         = impressions > 0 ? (spend / impressions) * 1000 : 0
  const cplMeta     = meta?.cpl ?? 0
  const cplGHL      = spend > 0 && ghlLeads > 0 ? spend / ghlLeads : 0
  const gap         = metaLeads > 0 && ghlLeads > 0
    ? Math.round(((metaLeads - ghlLeads) / metaLeads) * 100)
    : null

  return (
    <div className="space-y-3">

      {/* Header Meta */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#1877F2]" />
        <p className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Meta Ads</p>
        <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] ml-1">números nativos</span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <KpiCard
          label="Gasto total"
          value={spend > 0 ? formatCurrency(spend) : '—'}
          sub={spend > 0 && impressions > 0 ? `CPM ${formatCurrency(cpm)} · ${formatNumber(impressions)} impr.` : undefined}
          color="#F59E0B"
          icon="$"
        />
        <KpiCard
          label="Leads"
          value={formatNumber(metaLeads)}
          sub="leads Meta pixel"
          color="#1877F2"
          icon="↗"
        />
        <KpiCard
          label="CPL"
          value={cplMeta > 0 ? formatCurrencyDecimal(cplMeta) : '—'}
          sub="costo por lead"
          color="#8B5CF6"
          icon="÷"
        />
        <KpiCard
          label="CPC"
          value={meta?.cpc ? formatCurrencyDecimal(meta.cpc) : '—'}
          sub="costo por clic"
          color="#06B6D4"
          icon="⌖"
        />
        <KpiCard
          label="CTR"
          value={meta?.ctr ? `${meta.ctr.toFixed(2)}%` : '—'}
          sub="clics / impresiones"
          color="#10B981"
          icon="%"
        />
      </div>

      {/* GHL panel */}
      <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
        style={{ borderTopColor: '#F59E0B', borderTopWidth: 2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[var(--color-gold)]" />
          <p className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">CRM (GHL)</p>
          <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] ml-auto">leads reales</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-0.5">
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">Leads con tag</p>
            <p className="text-2xl font-semibold font-[var(--font-display)] tabular-nums leading-none" style={{ color: '#F59E0B' }}>
              {formatNumber(ghlLeads)}
            </p>
            {report?.class_tag && (
              <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)]">{report.class_tag}</p>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">CPL real</p>
            <p className="text-2xl font-semibold font-[var(--font-display)] tabular-nums leading-none" style={{ color: '#8B5CF6' }}>
              {cplGHL > 0 ? formatCurrencyDecimal(cplGHL) : '—'}
            </p>
            <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)]">
              {ghlLeads > 0 ? `÷ ${formatNumber(ghlLeads)} leads` : 'sin gasto Meta'}
            </p>
          </div>
        </div>

        {gap !== null && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
            <div className={`
              px-2 py-1 rounded text-[10px] font-semibold font-[var(--font-mono)]
              ${gap > 30 ? 'bg-[var(--color-red-dim)] text-[var(--color-red)]'
                : gap > 15 ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]'
                : 'bg-[var(--color-green-dim)] text-[var(--color-green)]'}
            `}>
              {gap > 0 ? `+${gap}%` : `${gap}%`} diferencia
            </div>
            <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)]">
              Meta reporta {gap > 0 ? 'más' : 'menos'} leads que GHL
            </p>
          </div>
        )}
      </div>

    </div>
  )
}

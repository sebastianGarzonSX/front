'use client'

import { MetaCampaignRow, ClaseReport } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

interface MetaVsGHLProps {
  report:    ClaseReport | null
  meta:      MetaCampaignRow | null  // campaña principal
  isLoading: boolean
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
        {label}
      </p>
      <p className="text-xl font-semibold font-[var(--font-display)] text-[var(--color-ink)] tabular-nums">
        {value}
      </p>
      {sub && <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)]">{sub}</p>}
    </div>
  )
}

export function MetaVsGHL({ report, meta, isLoading }: MetaVsGHLProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="skeleton h-32 rounded-[var(--radius-md)]" />
        <div className="skeleton h-32 rounded-[var(--radius-md)]" />
      </div>
    )
  }

  const metaLeads   = meta?.conversions ?? 0
  const ghlLeads    = report?.total_leads ?? 0
  const spend       = meta?.spend ?? 0
  const cplMeta     = meta?.cpl ?? 0
  const cplGHL      = spend > 0 && ghlLeads > 0 ? spend / ghlLeads : 0
  const gap         = metaLeads > 0 && ghlLeads > 0
    ? Math.round(((metaLeads - ghlLeads) / metaLeads) * 100)
    : null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* Meta */}
      <div className="
        p-5 rounded-[var(--radius-md)] border border-[var(--color-border)]
        bg-[var(--color-surface)]
      ">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-[#1877F2]" />
          <p className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">Meta Ads</p>
          <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] ml-auto">números nativos</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Leads" value={formatNumber(metaLeads)} />
          <Stat label="CPL" value={cplMeta > 0 ? formatCurrency(cplMeta) : '—'} />
          <Stat label="CPC" value={meta?.cpc ? formatCurrency(meta.cpc) : '—'} />
        </div>
        <div className="mt-4 pt-3 border-t border-[var(--color-border)] grid grid-cols-2 gap-4">
          <Stat label="Gasto" value={spend > 0 ? formatCurrency(spend) : '—'} />
          <Stat label="CTR" value={meta?.ctr ? `${meta.ctr.toFixed(2)}%` : '—'} />
        </div>
      </div>

      {/* GHL */}
      <div className="
        p-5 rounded-[var(--radius-md)] border border-[var(--color-border)]
        bg-[var(--color-surface)]
      ">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-[var(--color-gold)]" />
          <p className="text-xs font-semibold text-[var(--color-ink)] uppercase tracking-wider">CRM (GHL)</p>
          <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] ml-auto">leads reales</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Stat
            label="Leads con tag"
            value={formatNumber(ghlLeads)}
            sub={report?.class_tag ?? ''}
          />
          <Stat
            label="CPL real"
            value={cplGHL > 0 ? formatCurrency(cplGHL) : '—'}
            sub={spend > 0 ? `÷ ${formatNumber(ghlLeads)} leads` : 'sin gasto Meta'}
          />
        </div>

        {/* Brecha Meta vs GHL */}
        {gap !== null && (
          <div className="pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
            <div className={`
              px-2 py-1 rounded text-[10px] font-semibold font-[var(--font-mono)]
              ${gap > 30
                ? 'bg-[var(--color-red-dim)] text-[var(--color-red)]'
                : gap > 15
                  ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]'
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

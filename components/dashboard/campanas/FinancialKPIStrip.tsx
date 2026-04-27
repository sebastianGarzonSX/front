'use client'

import { AttributionReport } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

interface FinancialKPIStripProps {
  data:              AttributionReport | null
  isLoading:         boolean
  canViewFinancials: boolean
}

type Quality = 'star' | 'ok' | 'warn' | 'neutral'

interface ChipProps {
  label:     string
  value:     string
  sub?:      string
  quality?:  Quality
  isLoading?: boolean
}

const qualityStyle: Record<Quality, { border: string; value: string; dot: string }> = {
  star:    { border: 'border-[var(--color-green-dim)]',   value: 'text-[var(--color-green)]',  dot: 'bg-[var(--color-green)]'       },
  ok:      { border: 'border-[var(--color-gold-dim)]',    value: 'text-[var(--color-gold)]',   dot: 'bg-[var(--color-gold)]'        },
  warn:    { border: 'border-[#6B2626]',                  value: 'text-[var(--color-red)]',    dot: 'bg-[var(--color-red)]'         },
  neutral: { border: 'border-[var(--color-border)]',      value: 'text-[var(--color-ink)]',    dot: 'bg-[var(--color-border-2)]'    },
}

function Chip({ label, value, sub, quality = 'neutral', isLoading }: ChipProps) {
  const s = qualityStyle[quality]
  return (
    <div className={`
      flex-1 min-w-0 px-4 py-3.5 rounded-[var(--radius-md)]
      bg-[var(--color-surface)] border ${s.border}
      transition-all duration-200
    `}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
        <p className="text-[8.5px] font-[var(--font-mono)] tracking-[0.13em] uppercase text-[var(--color-ink-3)] truncate">
          {label}
        </p>
      </div>
      {isLoading ? (
        <div className="skeleton h-6 w-14 rounded" />
      ) : (
        <>
          <p className={`font-[var(--font-display)] text-xl font-semibold leading-none ${s.value}`}>
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)]">{sub}</p>
          )}
        </>
      )}
    </div>
  )
}

function roasQuality(r: number): Quality {
  if (r === 0) return 'neutral'
  if (r >= 3)  return 'star'
  if (r >= 1)  return 'ok'
  return 'warn'
}

function cplQuality(cpl: number): Quality {
  if (cpl === 0)        return 'neutral'
  if (cpl < 50_000)     return 'star'
  if (cpl < 150_000)    return 'ok'
  return 'warn'
}

function convQuality(pct: number): Quality {
  if (pct === 0)   return 'neutral'
  if (pct >= 10)   return 'star'
  if (pct >= 5)    return 'ok'
  return 'warn'
}

export function FinancialKPIStrip({ data, isLoading, canViewFinancials }: FinancialKPIStripProps) {
  const ads   = data?.by_ad ?? []
  const meta  = data?.meta_totals

  const totalLeads   = ads.reduce((s, r) => s + r.total_leads,  0)
  const totalConv    = ads.reduce((s, r) => s + r.conversions,  0)
  const totalRevenue = ads.reduce((s, r) => s + r.revenue,      0)
  const totalSpend   = meta?.total_spend ?? 0

  const roas     = totalSpend > 0 ? totalRevenue / totalSpend : 0
  const cpl      = totalSpend > 0 && totalLeads > 0 ? totalSpend / totalLeads : 0
  const cpa      = totalSpend > 0 && totalConv  > 0 ? totalSpend / totalConv  : 0
  const revLead  = totalLeads > 0 ? totalRevenue / totalLeads : 0
  const convRate = totalLeads > 0 ? (totalConv / totalLeads) * 100 : 0

  if (!canViewFinancials) {
    return (
      <div className="flex gap-2 flex-wrap">
        <Chip
          label="Leads atribuidos"
          value={formatNumber(totalLeads)}
          sub="con fuente identificada"
          isLoading={isLoading}
        />
        <Chip
          label="Conversiones"
          value={formatNumber(totalConv)}
          sub="oportunidades ganadas"
          isLoading={isLoading}
        />
        <Chip
          label="Tasa de conversión"
          value={`${convRate.toFixed(1)}%`}
          sub={`${totalConv} de ${totalLeads} leads`}
          quality={convQuality(convRate)}
          isLoading={isLoading}
        />
      </div>
    )
  }

  const metaActive = totalSpend > 0

  return (
    <div className="flex gap-2 flex-wrap">
      {/* ROAS — métrica reina */}
      <Chip
        label="ROAS"
        value={metaActive && roas > 0 ? `${roas.toFixed(1)}×` : '—'}
        sub={
          metaActive
            ? roas >= 3 ? 'Retorno excelente (≥3×)'
            : roas >= 1 ? 'Rentable (≥1×)'
            : roas > 0  ? 'Bajo retorno (<1×)'
            : 'Sin ingresos atribuidos'
            : 'Activa sync de Meta para ver'
        }
        quality={metaActive ? roasQuality(roas) : 'neutral'}
        isLoading={isLoading}
      />

      {/* CPL */}
      <Chip
        label="Costo / Lead"
        value={metaActive && cpl > 0 ? formatCurrency(cpl) : '—'}
        sub="Meta spend ÷ leads GHL"
        quality={metaActive ? cplQuality(cpl) : 'neutral'}
        isLoading={isLoading}
      />

      {/* CPA / CAC */}
      <Chip
        label="Costo / Venta"
        value={metaActive && cpa > 0 ? formatCurrency(cpa) : '—'}
        sub="Meta spend ÷ opp. ganadas"
        quality={metaActive && cpa > 0 ? (cpa < 300_000 ? 'star' : cpa < 800_000 ? 'ok' : 'warn') : 'neutral'}
        isLoading={isLoading}
      />

      {/* Revenue per Lead */}
      <Chip
        label="Ingreso / Lead"
        value={revLead > 0 ? formatCurrency(revLead) : '—'}
        sub="ingresos GHL ÷ leads"
        quality={revLead > 0
          ? (metaActive && cpl > 0
             ? (revLead > cpl * 3 ? 'star' : revLead > cpl ? 'ok' : 'warn')
             : 'ok')
          : 'neutral'}
        isLoading={isLoading}
      />

      {/* Conv rate */}
      <Chip
        label="Tasa de conversión"
        value={`${convRate.toFixed(1)}%`}
        sub={`${formatNumber(totalConv)} ventas de ${formatNumber(totalLeads)} leads`}
        quality={convQuality(convRate)}
        isLoading={isLoading}
      />
    </div>
  )
}

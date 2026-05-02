'use client'

import { ClaseReport, MetaCampaignRow } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'
import { Calendar, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react'

interface SessionsPurchasesProps {
  report:    ClaseReport | null
  meta:      MetaCampaignRow | null
  isLoading: boolean
}

interface MetricTileProps {
  icon:    React.ReactNode
  label:   string
  value:   string
  sub?:    string
  color?:  string
}

function MetricTile({ icon, label, value, sub, color = 'var(--color-gold)' }: MetricTileProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
      <div
        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: color + '22', color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
          {label}
        </p>
        <p className="text-xl font-semibold font-[var(--font-display)] text-[var(--color-ink)] tabular-nums mt-0.5">
          {value}
        </p>
        {sub && (
          <p className="text-[10px] text-[var(--color-ink-3)] font-[var(--font-mono)] mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  )
}

export function SessionsPurchases({ report, meta, isLoading }: SessionsPurchasesProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map((i) => <div key={i} className="skeleton h-24 rounded-[var(--radius-md)]" />)}
      </div>
    )
  }

  if (!report) {
    return <p className="text-xs text-[var(--color-ink-3)] text-center py-8">Seleccioná una clase.</p>
  }

  const spend         = meta?.spend ?? 0
  const sessions      = report.sessions
  const purchases     = report.purchases
  const totalLeads    = report.total_leads

  const sesConvRate   = totalLeads > 0  ? ((sessions  / totalLeads) * 100).toFixed(1)  : '0'
  const buyConvRate   = sessions   > 0  ? ((purchases / sessions)  * 100).toFixed(1)  : '0'
  const costPerSes    = spend > 0 && sessions  > 0 ? spend / sessions  : 0
  const costPerBuy    = spend > 0 && purchases > 0 ? spend / purchases : 0

  return (
    <div className="space-y-4">
      {/* Sesiones */}
      <div>
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-2">
          Sesiones agendadas
        </p>
        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            icon={<Calendar size={16} />}
            label="Sesiones"
            value={formatNumber(sessions)}
            sub={`${sesConvRate}% de ${formatNumber(totalLeads)} leads`}
            color="var(--color-gold)"
          />
          <MetricTile
            icon={<DollarSign size={16} />}
            label="Costo / sesión"
            value={costPerSes > 0 ? formatCurrency(costPerSes) : '—'}
            sub={spend > 0 ? `${formatCurrency(spend)} gasto total` : 'sin datos de Meta'}
            color="var(--color-gold)"
          />
        </div>
      </div>

      {/* Compras */}
      <div>
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-2">
          Compras realizadas
        </p>
        <div className="grid grid-cols-2 gap-3">
          <MetricTile
            icon={<ShoppingBag size={16} />}
            label="Compras"
            value={formatNumber(purchases)}
            sub={`${buyConvRate}% de ${formatNumber(sessions)} sesiones`}
            color="var(--color-green)"
          />
          <MetricTile
            icon={<TrendingUp size={16} />}
            label="Costo / compra"
            value={costPerBuy > 0 ? formatCurrency(costPerBuy) : '—'}
            sub={report.revenue > 0 ? `${formatCurrency(report.revenue)} ingresos` : 'sin ingresos registrados'}
            color="var(--color-green)"
          />
        </div>
      </div>
    </div>
  )
}

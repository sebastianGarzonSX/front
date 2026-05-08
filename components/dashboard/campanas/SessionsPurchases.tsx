'use client'

import { ClaseReport, MetaCampaignRow } from '@/types'
import { formatCurrency, formatCurrencyDecimal, formatNumber } from '@/components/dashboard/KPICard'
import { Calendar, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react'
import { CalendarSyncPanel } from './CalendarSyncPanel'
import { AppointmentsTimeline } from './AppointmentsTimeline'
import { useCalendarSync } from '@/hooks/useCalendarSync'

interface SessionsPurchasesProps {
  report:    ClaseReport | null
  meta:      MetaCampaignRow | null
  isLoading: boolean
  since:     string
  until:     string
  tag?:      string | null
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

export function SessionsPurchases({ report, meta, isLoading, since, until, tag = null }: SessionsPurchasesProps) {
  // Hook compartido entre el tile de Sesiones y el panel de calendario:
  // garantiza que ambos usen la misma fuente (agendamientos del calendario GHL).
  const calSync = useCalendarSync(since, until, tag)

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
  const purchases     = report.purchases
  const totalLeads    = report.total_leads

  // Sesiones = agendamientos activos del calendario (cuando está configurado).
  // Fallback: el conteo del CRM si todavía no hay calendario sincronizado.
  const calendarReady = calSync.calendarId !== null && calSync.appointments?.count !== null
  const sessions      = calendarReady
    ? (calSync.appointments?.count ?? 0)
    : report.sessions
  const sessionsSource = calendarReady ? 'agendamientos GHL' : 'CRM (tag)'

  const sesConvRate   = totalLeads > 0  ? ((sessions  / totalLeads) * 100).toFixed(2)  : '0'
  const buyConvRate   = sessions   > 0  ? ((purchases / sessions)  * 100).toFixed(2)  : '0'
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
            sub={`${sesConvRate}% de ${formatNumber(totalLeads)} leads · ${sessionsSource}`}
            color="var(--color-gold)"
          />
          <MetricTile
            icon={<DollarSign size={16} />}
            label="Costo / sesión"
            value={costPerSes > 0 ? formatCurrencyDecimal(costPerSes) : '—'}
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
            value={costPerBuy > 0 ? formatCurrencyDecimal(costPerBuy) : '—'}
            sub={report.revenue > 0 ? `${formatCurrency(report.revenue)} ingresos` : 'sin ingresos registrados'}
            color="var(--color-green)"
          />
        </div>
      </div>

      {/* Separador + sincronización calendario */}
      <div className="pt-3 border-t border-[var(--color-border)]">
        <CalendarSyncPanel sync={calSync} />
      </div>

      {/* Mini calendario / timeline de agendamientos con leads */}
      {calSync.appointments?.items && calSync.appointments.items.length > 0 && (
        <div className="pt-3 border-t border-[var(--color-border)]">
          <AppointmentsTimeline
            items={calSync.appointments.items}
            since={since}
            until={until}
          />
        </div>
      )}
    </div>
  )
}

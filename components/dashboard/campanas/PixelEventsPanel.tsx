'use client'

import { useState } from 'react'
import { Eye, UserPlus, FileCheck, Phone, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { PixelEventsResponse } from '@/types'
import { formatCurrency, formatCurrencyDecimal, formatNumber } from '@/components/dashboard/KPICard'

interface Props {
  data:      PixelEventsResponse | null
  isLoading: boolean
  error?:    string | null
}

const ICONS: Record<string, React.ReactNode> = {
  page_view:             <Eye size={14} />,
  lead:                  <UserPlus size={14} />,
  complete_registration: <FileCheck size={14} />,
  contact:               <Phone size={14} />,
  wa_group_click:        <MessageCircle size={14} />,
}

const ACCENTS: Record<string, string> = {
  page_view:             '#5C9FD4',
  lead:                  '#3DAB6E',
  complete_registration: '#8B6EBF',
  contact:               '#C9973A',
  wa_group_click:        '#25D366',
}

export function PixelEventsPanel({ data, isLoading, error }: Props) {
  const [showRaw, setShowRaw] = useState(false)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[0,1,2,3,4].map((i) => <div key={i} className="skeleton h-24 rounded-[var(--radius-md)]" />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[var(--color-red)]">No se pudieron cargar los eventos del pixel</p>
        <p className="text-[10px] text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">{error}</p>
      </div>
    )
  }

  if (!data || data.campaign_count === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-[var(--color-ink-3)]">Sin campañas [CLASE SEM] en el rango.</p>
        <p className="text-[10px] text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">
          Revisá el filtro de tag o de fechas
        </p>
      </div>
    )
  }

  const totalLead = data.totals.find(t => t.key === 'lead')?.count ?? 0
  const totalContact = data.totals.find(t => t.key === 'contact')?.count ?? 0
  const totalWA = data.totals.find(t => t.key === 'wa_group_click')?.count ?? 0

  // Tasa: contact / lead, wa / lead
  const contactRate = totalLead > 0 ? (totalContact / totalLead) * 100 : 0
  const waRate      = totalLead > 0 ? (totalWA / totalLead)      * 100 : 0

  return (
    <div className="space-y-4">
      {/* ── Tiles por evento ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {data.totals.map((t) => {
          const accent = ACCENTS[t.key] ?? 'var(--color-ink)'
          return (
            <div
              key={t.key}
              className="relative p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
              style={{ borderTopColor: accent, borderTopWidth: 2 }}
            >
              <div className="flex items-center gap-1.5 mb-1.5" style={{ color: accent }}>
                {ICONS[t.key]}
                <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest">
                  {t.label}
                </p>
              </div>
              <p className="text-2xl font-semibold font-[var(--font-display)] tabular-nums leading-none text-[var(--color-ink)]">
                {formatNumber(t.count)}
              </p>
              {t.cost_per > 0 && (
                <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-1">
                  {formatCurrencyDecimal(t.cost_per)} / evento
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Tasas relacionales ───────────────────────────────────────────── */}
      {totalLead > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)]">
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
              Contact / Lead
            </p>
            <p className="text-lg font-semibold font-[var(--font-display)] tabular-nums leading-none text-[var(--color-ink)] mt-1">
              {contactRate.toFixed(2)}%
            </p>
            <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-1">
              {formatNumber(totalContact)} de {formatNumber(totalLead)} leads tocaron Contact
            </p>
          </div>
          <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)]">
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
              WhatsApp Click / Lead
            </p>
            <p className="text-lg font-semibold font-[var(--font-display)] tabular-nums leading-none text-[var(--color-ink)] mt-1">
              {waRate.toFixed(2)}%
            </p>
            <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-1">
              {formatNumber(totalWA)} clicks al grupo de WhatsApp
            </p>
          </div>
        </div>
      )}

      {/* ── Tabla por campaña ────────────────────────────────────────────── */}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden">
        <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between">
          <p className="text-[10px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
            {data.campaign_count} campaña{data.campaign_count === 1 ? '' : 's'} · {formatCurrency(data.total_spend)} gasto
          </p>
          <button
            onClick={() => setShowRaw(s => !s)}
            className="flex items-center gap-1 text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]"
          >
            {showRaw ? 'Ocultar' : 'Ver'} action_types crudos
            {showRaw ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-[var(--color-surface)]">
              <tr className="border-b border-[var(--color-border)] text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
                <th className="text-left px-3 py-2">Campaña</th>
                <th className="text-right px-2 py-2">Gasto</th>
                {data.totals.map((t) => (
                  <th key={t.key} className="text-right px-2 py-2">{t.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.by_campaign.map((row) => (
                <tr key={row.campaign_id} className="border-b border-[var(--color-border)] last:border-b-0">
                  <td className="px-3 py-2 truncate max-w-[260px]" title={row.campaign_name}>
                    {row.campaign_name}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums font-[var(--font-mono)]">
                    {formatCurrency(row.spend)}
                  </td>
                  {data.totals.map((t) => (
                    <td key={t.key} className="px-2 py-2 text-right tabular-nums font-[var(--font-mono)]">
                      {formatNumber(row.events[t.key] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showRaw && (
          <div className="border-t border-[var(--color-border)] p-3 bg-[var(--color-surface-2)] space-y-3">
            {data.by_campaign.map((row) => (
              <div key={row.campaign_id}>
                <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-2)] mb-1 truncate">
                  {row.campaign_name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(row.raw_actions).length === 0 && (
                    <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
                      sin actions
                    </span>
                  )}
                  {Object.entries(row.raw_actions)
                    .sort((a, b) => b[1] - a[1])
                    .map(([k, v]) => (
                      <span
                        key={k}
                        className="px-1.5 py-0.5 rounded text-[10px] font-[var(--font-mono)] bg-[var(--color-surface)] border border-[var(--color-border)]"
                      >
                        {k} <span className="text-[var(--color-ink-3)]">· {formatNumber(v)}</span>
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
        Datos: Meta Ads Insights · campañas con nombre que contiene "CLASE SEM" en el rango {data.since} → {data.until}
      </p>
    </div>
  )
}

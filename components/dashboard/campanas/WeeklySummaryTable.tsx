'use client'

import { ClaseSummaryRow } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

interface WeeklySummaryTableProps {
  rows:        ClaseSummaryRow[]
  isLoading:   boolean
  selectedTag: string | null
  onSelect:    (tag: string) => void
  metaSpendByTag?: Record<string, number>
}

export function WeeklySummaryTable({ rows, isLoading, selectedTag, onSelect, metaSpendByTag = {} }: WeeklySummaryTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1,2,3].map((i) => (
          <div key={i} className="skeleton h-9 rounded" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="text-xs text-[var(--color-ink-3)] text-center py-6">
        Sin clases registradas. Asegurate de que los leads tengan etiquetas con formato <code>clase DD/mes</code>.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto -mx-5 -mb-5">
      <table className="w-full text-xs min-w-[680px]">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {['Clase', 'Leads GHL', 'Lead Magnet', 'Sesiones', 'Conv. ses.', 'Compras', 'Conv. compra', 'Ingresos'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left">
                <span className="text-[8px] font-[var(--font-mono)] tracking-widest uppercase text-[var(--color-ink-3)]">
                  {h}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isActive    = selectedTag === row.class_tag
            const sesConv     = row.crm_leads > 0 ? Math.round((row.sessions / row.crm_leads) * 100) : 0
            const buyConv     = row.sessions > 0  ? Math.round((row.purchases / row.sessions) * 100) : 0

            return (
              <tr
                key={row.class_tag}
                onClick={() => onSelect(row.class_tag)}
                className={`
                  border-b border-[var(--color-border)] last:border-0
                  cursor-pointer transition-colors
                  ${isActive
                    ? 'bg-[var(--color-gold-glow)]'
                    : 'hover:bg-[var(--color-surface-2)]'}
                `}
              >
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${isActive ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink)]'}`}>
                    {row.class_tag}
                  </span>
                </td>
                <td className="px-4 py-3 font-[var(--font-mono)] tabular-nums text-[var(--color-ink)]">
                  {formatNumber(row.crm_leads)}
                </td>
                <td className="px-4 py-3 font-[var(--font-mono)] tabular-nums text-[var(--color-ink-2)]">
                  {row.lm_engaged > 0 ? (
                    <span>
                      {formatNumber(row.lm_engaged)}
                      <span className="text-[var(--color-ink-3)] ml-1">
                        ({row.crm_leads > 0 ? Math.round((row.lm_engaged / row.crm_leads) * 100) : 0}%)
                      </span>
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 font-[var(--font-mono)] tabular-nums text-[var(--color-ink-2)]">
                  {formatNumber(row.sessions)}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-[var(--font-mono)] text-xs tabular-nums ${sesConv >= 10 ? 'text-[var(--color-green)]' : sesConv >= 5 ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-3)]'}`}>
                    {sesConv}%
                  </span>
                </td>
                <td className="px-4 py-3 font-[var(--font-mono)] tabular-nums text-[var(--color-ink-2)]">
                  {formatNumber(row.purchases)}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-[var(--font-mono)] text-xs tabular-nums ${buyConv >= 20 ? 'text-[var(--color-green)]' : buyConv >= 10 ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-3)]'}`}>
                    {buyConv}%
                  </span>
                </td>
                <td className="px-4 py-3 font-[var(--font-mono)] tabular-nums text-[var(--color-gold)]">
                  {row.revenue > 0 ? formatCurrency(row.revenue) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

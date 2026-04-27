'use client'

import { AttributionByAd } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'
import { ArrowUpRight, Minus } from 'lucide-react'

interface AttributionTableProps {
  rows: AttributionByAd[]
  isLoading: boolean
  canViewFinancials: boolean
  metaEnabled: boolean
}

function pct(a: number, b: number): number {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}

function cpl(spend: number, leads: number): number {
  return leads === 0 ? 0 : spend / leads
}

function cpconv(spend: number, conv: number): number {
  return conv === 0 ? 0 : spend / conv
}

function roas(revenue: number, spend: number): number {
  return spend === 0 ? 0 : revenue / spend
}

export function AttributionTable({
  rows,
  isLoading,
  canViewFinancials,
  metaEnabled,
}: AttributionTableProps) {
  const maxLeads = Math.max(...rows.map((r) => r.total_leads), 1)

  if (isLoading) return <AttributionTableSkeleton />

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-[var(--color-ink-3)]">Sin datos de atribución para el período.</p>
        <p className="mt-1 text-xs text-[var(--color-ink-3)] opacity-60">
          Ejecuta un sync para poblar los campos de atribución.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {[
              'Anuncio / Fuente',
              'Leads GHL',
              'Conv.',
              'Tasa',
              ...(metaEnabled && canViewFinancials ? ['Gasto Meta', 'Costo/Lead', 'Costo/Conv.', 'ROAS'] : []),
              ...(canViewFinancials ? ['Ingresos'] : []),
            ].map((h) => (
              <th
                key={h}
                className="
                  px-3 py-2.5 text-left
                  text-[9px] font-[var(--font-mono)] tracking-[0.12em] uppercase
                  text-[var(--color-ink-3)] font-normal whitespace-nowrap
                "
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const convRate  = pct(row.conversions, row.total_leads)
            const cplVal    = cpl(row.meta_spend, row.total_leads)
            const cpcVal    = cpconv(row.meta_spend, row.conversions)
            const roasVal   = roas(row.revenue, row.meta_spend)
            const barWidth  = pct(row.total_leads, maxLeads)
            const isTop     = i === 0 && row.total_leads > 0
            const rowKey    = `${row.attribution_ad_id ?? 'null'}-${row.attribution_utm_source ?? ''}-${i}`

            return (
              <tr
                key={rowKey}
                className="
                  border-b border-[var(--color-border)] last:border-b-0
                  hover:bg-[var(--color-surface-2)] transition-colors duration-100
                  group
                "
              >
                {/* Anuncio */}
                <td className="px-3 py-3 max-w-[260px]">
                  <div className="flex items-start gap-2">
                    {isTop && (
                      <ArrowUpRight
                        size={11}
                        className="text-[var(--color-gold)] mt-0.5 flex-shrink-0"
                      />
                    )}
                    <div>
                      <p className="text-[var(--color-ink)] font-medium leading-snug line-clamp-1">
                        {row.attribution_ad_name ?? row.attribution_ad_id ?? 'Sin atribución'}
                      </p>
                      {row.attribution_utm_source && (
                        <p className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5 uppercase tracking-wide">
                          {row.attribution_utm_source}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Leads con mini-bar */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-[var(--font-mono)] text-[var(--color-ink)] tabular-nums">
                      {formatNumber(row.total_leads)}
                    </span>
                    <div className="w-16 h-1 bg-[var(--color-border)] rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full bg-[var(--color-gold)] rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Conversiones */}
                <td className="px-3 py-3">
                  <span className="font-[var(--font-mono)] tabular-nums text-[var(--color-ink)]">
                    {row.conversions > 0 ? formatNumber(row.conversions) : <Minus size={10} className="text-[var(--color-ink-3)]" />}
                  </span>
                </td>

                {/* Tasa de conversión */}
                <td className="px-3 py-3">
                  <span className={`
                    font-[var(--font-mono)] tabular-nums text-xs font-medium
                    ${convRate >= 10 ? 'text-[var(--color-green)]' : convRate >= 5 ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-2)]'}
                  `}>
                    {convRate}%
                  </span>
                </td>

                {/* Meta financials */}
                {metaEnabled && canViewFinancials && (
                  <>
                    <td className="px-3 py-3 font-[var(--font-mono)] tabular-nums text-[var(--color-ink-2)]">
                      {row.meta_spend > 0 ? formatCurrency(row.meta_spend) : <Minus size={10} className="text-[var(--color-ink-3)]" />}
                    </td>
                    <td className="px-3 py-3 font-[var(--font-mono)] tabular-nums text-[var(--color-ink-2)]">
                      {cplVal > 0 ? formatCurrency(cplVal) : <Minus size={10} className="text-[var(--color-ink-3)]" />}
                    </td>
                    <td className="px-3 py-3 font-[var(--font-mono)] tabular-nums text-[var(--color-ink-2)]">
                      {cpcVal > 0 ? formatCurrency(cpcVal) : <Minus size={10} className="text-[var(--color-ink-3)]" />}
                    </td>
                    <td className="px-3 py-3">
                      {roasVal > 0 ? (
                        <span className={`
                          font-[var(--font-mono)] tabular-nums font-semibold
                          ${roasVal >= 3 ? 'text-[var(--color-green)]' : roasVal >= 1 ? 'text-[var(--color-gold)]' : 'text-[var(--color-red)]'}
                        `}>
                          {roasVal.toFixed(1)}x
                        </span>
                      ) : (
                        <Minus size={10} className="text-[var(--color-ink-3)]" />
                      )}
                    </td>
                  </>
                )}

                {/* Ingresos GHL */}
                {canViewFinancials && (
                  <td className="px-3 py-3 font-[var(--font-mono)] tabular-nums text-[var(--color-ink-2)]">
                    {row.revenue > 0 ? formatCurrency(row.revenue) : <Minus size={10} className="text-[var(--color-ink-3)]" />}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AttributionTableSkeleton() {
  return (
    <div className="space-y-0">
      <div className="flex gap-4 px-3 py-2.5 border-b border-[var(--color-border)]">
        {[200, 80, 60, 60, 100, 100, 100, 80].map((w, i) => (
          <div key={i} className="skeleton rounded" style={{ height: 10, width: w }} />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-3 py-3 border-b border-[var(--color-border)] last:border-0">
          <div className="skeleton rounded" style={{ height: 14, width: 180 }} />
          <div className="skeleton rounded" style={{ height: 14, width: 70 }} />
          <div className="skeleton rounded" style={{ height: 14, width: 50 }} />
          <div className="skeleton rounded" style={{ height: 14, width: 50 }} />
        </div>
      ))}
    </div>
  )
}

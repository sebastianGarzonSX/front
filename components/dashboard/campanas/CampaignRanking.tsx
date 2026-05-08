'use client'

import { useState } from 'react'
import { AttributionByAd } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'
import { ArrowUp, ArrowDown, ArrowUpDown, Minus, ExternalLink, Globe } from 'lucide-react'

interface CampaignRankingProps {
  rows:              AttributionByAd[]
  isLoading:         boolean
  canViewFinancials: boolean
  metaEnabled:       boolean
}

type SortKey    = 'roas' | 'total_leads' | 'conversions' | 'meta_spend' | 'revenue' | 'conv_rate'
type SortDir    = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'inactive'

interface EnrichedRow extends AttributionByAd {
  roas:      number
  cpl:       number
  conv_rate: number
}

function calcRoas(revenue: number, spend: number) {
  return spend > 0 && revenue > 0 ? revenue / spend : 0
}
function calcCpl(spend: number, leads: number) {
  return spend > 0 && leads > 0 ? spend / leads : 0
}
function calcConvRate(conv: number, leads: number) {
  return leads > 0 ? (conv / leads) * 100 : 0
}

// ── ROAS badge ────────────────────────────────────────────────────────────────

function RoasBadge({ roas }: { roas: number }) {
  if (roas === 0) {
    return <span className="text-[var(--color-ink-3)] font-[var(--font-mono)] text-[11px]">—</span>
  }
  const good = roas >= 3
  const ok   = roas >= 1
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded
      text-xs font-semibold font-[var(--font-mono)] tabular-nums
      ${good ? 'bg-[var(--color-green-dim)] text-[var(--color-green)]'
             : ok ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)]'
                  : 'bg-[#6B2626] text-[var(--color-red)]'}
    `}>
      {roas.toFixed(2)}×
    </span>
  )
}

// ── Column headers ────────────────────────────────────────────────────────────

interface ColDef {
  key:        SortKey
  label:      string
  financial?: boolean
  meta?:      boolean
  align?:     'left' | 'right'
}

const COLS: ColDef[] = [
  { key: 'total_leads',  label: 'Leads',        align: 'right' },
  { key: 'conv_rate',    label: 'Conv %',        align: 'right' },
  { key: 'meta_spend',   label: 'Gasto Meta',    align: 'right', financial: true, meta: true },
  { key: 'revenue',      label: 'Ingresos',      align: 'right', financial: true },
  { key: 'roas',         label: 'ROAS',          align: 'right', financial: true, meta: true },
]

function SortIcon({ col, cur, dir }: { col: SortKey; cur: SortKey; dir: SortDir }) {
  if (col !== cur) return <ArrowUpDown size={8} className="opacity-0 group-hover:opacity-40 transition-opacity" />
  return dir === 'desc'
    ? <ArrowDown size={8} className="text-[var(--color-gold)]" />
    : <ArrowUp   size={8} className="text-[var(--color-gold)]" />
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CampaignRanking({
  rows,
  isLoading,
  canViewFinancials,
  metaEnabled,
}: CampaignRankingProps) {
  const [sortKey,      setSortKey]      = useState<SortKey>('total_leads')
  const [sortDir,      setSortDir]      = useState<SortDir>('desc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const enriched: EnrichedRow[] = rows.map((r) => ({
    ...r,
    roas:      calcRoas(r.revenue, r.meta_spend),
    cpl:       calcCpl(r.meta_spend, r.total_leads),
    conv_rate: calcConvRate(r.conversions, r.total_leads),
  }))

  // Aplicar filtro de estado
  const filtered = enriched.filter((r) => {
    if (statusFilter === 'all')      return true
    if (statusFilter === 'active')   return r.ad_status === 'ACTIVE'
    if (statusFilter === 'inactive') return r.ad_status !== 'ACTIVE' && r.ad_status !== null
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] as number
    const bv = b[sortKey] as number
    return sortDir === 'desc' ? bv - av : av - bv
  })

  const maxLeads = Math.max(...enriched.map((r) => r.total_leads), 1)

  // Conteos para las pills de filtro
  const countActive   = enriched.filter((r) => r.ad_status === 'ACTIVE').length
  const countInactive = enriched.filter((r) => r.ad_status !== 'ACTIVE' && r.ad_status !== null).length
  const hasStatusData = enriched.some((r) => r.ad_status !== null && r.ad_status !== 'UNKNOWN')

  const visibleCols = COLS.filter(
    (c) => (!c.financial || canViewFinancials) && (!c.meta || metaEnabled)
  )

  if (isLoading) {
    return (
      <div className="-mx-5 -mb-5">
        <div className="flex gap-3 px-5 py-2 border-b border-[var(--color-border)]">
          {[20, 200, 70, 60].map((w, i) => <div key={i} className="skeleton rounded" style={{ height: 8, width: w }} />)}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center px-5 py-3 border-b border-[var(--color-border)] last:border-0">
            <div className="skeleton rounded" style={{ height: 10, width: 14 }} />
            <div className="skeleton rounded" style={{ height: 12, width: 180 }} />
            <div className="skeleton rounded ml-auto" style={{ height: 10, width: 60 }} />
            <div className="skeleton rounded" style={{ height: 10, width: 50 }} />
          </div>
        ))}
      </div>
    )
  }

  if (sorted.length === 0 && enriched.length === 0) {
    return (
      <div className="py-14 text-center">
        <p className="text-xs text-[var(--color-ink-3)]">Sin datos de atribución para el período.</p>
        <p className="text-[10px] text-[var(--color-ink-3)] opacity-50 mt-1 font-[var(--font-mono)]">
          Ejecuta un sync con force=true para poblar los campos.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filtro de estado — solo se muestra si hay datos de status de Meta */}
      {hasStatusData && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {(
            [
              { key: 'all',      label: 'Todos',      count: enriched.length },
              { key: 'active',   label: 'Activos',    count: countActive   },
              { key: 'inactive', label: 'Pausados',   count: countInactive },
            ] as { key: StatusFilter; label: string; count: number }[]
          ).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-[var(--font-mono)]
                transition-all duration-150
                ${statusFilter === key
                  ? 'bg-[var(--color-surface-2)] border border-[var(--color-border-2)] text-[var(--color-ink)]'
                  : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]'}
              `}
            >
              {key === 'active' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] flex-shrink-0" />
              )}
              {key === 'inactive' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-3)] flex-shrink-0" />
              )}
              {label}
              <span className="opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 && (
        <p className="text-xs text-[var(--color-ink-3)] text-center py-8">
          Sin anuncios {statusFilter === 'active' ? 'activos' : 'pausados'} en el período.
        </p>
      )}

    <div className="overflow-x-auto -mx-5 -mb-5">
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {/* # */}
            <th className="px-5 py-2.5 text-left w-8 select-none">
              <span className="text-[8px] font-[var(--font-mono)] tracking-[0.1em] uppercase text-[var(--color-ink-3)]">#</span>
            </th>
            {/* Name */}
            <th className="px-3 py-2.5 text-left">
              <span className="text-[8px] font-[var(--font-mono)] tracking-[0.1em] uppercase text-[var(--color-ink-3)]">
                Anuncio / Fuente
              </span>
            </th>
            {/* Dynamic columns */}
            {visibleCols.map((col) => (
              <th key={col.key} className="px-3 py-2.5 text-right whitespace-nowrap">
                <button
                  className="flex items-center justify-end gap-1 ml-auto group cursor-pointer"
                  onClick={() => toggleSort(col.key)}
                >
                  <span className={`
                    text-[8px] font-[var(--font-mono)] tracking-[0.1em] uppercase
                    ${sortKey === col.key ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-3)]'}
                  `}>
                    {col.label}
                  </span>
                  <SortIcon col={col.key} cur={sortKey} dir={sortDir} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const barW      = Math.round((row.total_leads / maxLeads) * 100)
            const isTop     = i === 0
            const isTopRoas = isTop && row.roas > 0

            return (
              <tr
                key={`cr-${row.attribution_ad_id ?? 'null'}-${i}`}
                className={`
                  border-b border-[var(--color-border)] last:border-0
                  hover:bg-[var(--color-surface-2)] transition-colors duration-100
                  ${isTopRoas ? 'bg-[rgba(201,151,58,0.03)]' : ''}
                `}
              >
                {/* Rank */}
                <td className="px-5 py-3 text-left">
                  <span className={`
                    font-[var(--font-mono)] text-[10px] tabular-nums
                    ${i === 0 ? 'text-[var(--color-gold)]' : i < 3 ? 'text-[var(--color-ink-2)]' : 'text-[var(--color-ink-3)]'}
                  `}>
                    {i + 1}
                  </span>
                </td>

                {/* Name + thumbnail + links */}
                <td className="px-3 py-3 max-w-[240px]">
                  <div className="flex items-center gap-2.5">
                    {/* Thumbnail — 72×72 para ver el creativo */}
                    {row.thumbnail_url ? (
                      <div className="w-[72px] h-[72px] rounded-[var(--radius-sm)] flex-shrink-0 overflow-hidden border border-[var(--color-border)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement
                            el.style.display = 'none'
                            el.parentElement!.innerHTML = '<span class="text-[8px] text-[var(--color-ink-3)] flex items-center justify-center w-full h-full">AD</span>'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-[72px] h-[72px] rounded-[var(--radius-sm)] flex-shrink-0 bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
                        <span className="text-[9px] text-[var(--color-ink-3)] font-[var(--font-mono)]">AD</span>
                      </div>
                    )}

                    {/* Name + source + links */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-medium text-[var(--color-ink)] leading-snug line-clamp-1">
                          {row.attribution_ad_name ?? row.attribution_utm_source ?? row.attribution_ad_id ?? 'Sin atribución'}
                        </p>
                        {/* Badge de estado */}
                        {row.ad_status === 'ACTIVE' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] flex-shrink-0" title="Activo" />
                        )}
                        {(row.ad_status === 'PAUSED' || row.ad_status === 'ARCHIVED') && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ink-3)] flex-shrink-0" title={row.ad_status === 'PAUSED' ? 'Pausado' : 'Archivado'} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {row.attribution_utm_source && (
                          <span className="text-[8px] font-[var(--font-mono)] text-[var(--color-ink-3)] uppercase tracking-wide">
                            {row.attribution_utm_source}
                          </span>
                        )}
                        {/* Link a landing page (desde GHL attribution pageUrl) */}
                        {row.attribution_page_url && (
                          <a
                            href={row.attribution_page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir landing page"
                            className="text-[var(--color-ink-3)] hover:text-[var(--color-gold)] transition-colors flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Globe size={9} />
                          </a>
                        )}
                        {/* Link a vista previa del anuncio en Meta */}
                        {row.preview_link && (
                          <a
                            href={row.preview_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver anuncio en Meta"
                            className="text-[var(--color-ink-3)] hover:text-[#1877F2] transition-colors flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={9} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Dynamic cells */}
                {visibleCols.map((col) => (
                  <td key={col.key} className="px-3 py-3 text-right">
                    {col.key === 'total_leads' && (
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-10 h-1 bg-[var(--color-border)] rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className="h-full bg-[var(--color-gold)] rounded-full transition-all duration-500"
                            style={{ width: `${barW}%` }}
                          />
                        </div>
                        <span className="font-[var(--font-mono)] tabular-nums text-[var(--color-ink)] text-[11px]">
                          {formatNumber(row.total_leads)}
                        </span>
                      </div>
                    )}

                    {col.key === 'conv_rate' && (
                      <span className={`
                        font-[var(--font-mono)] tabular-nums text-[11px] font-medium
                        ${row.conv_rate >= 10 ? 'text-[var(--color-green)]'
                        : row.conv_rate >= 5  ? 'text-[var(--color-gold)]'
                        : 'text-[var(--color-ink-2)]'}
                      `}>
                        {row.conv_rate.toFixed(2)}%
                      </span>
                    )}

                    {col.key === 'meta_spend' && (
                      <span className="font-[var(--font-mono)] tabular-nums text-[11px] text-[var(--color-ink-2)]">
                        {row.meta_spend > 0
                          ? formatCurrency(row.meta_spend)
                          : <Minus size={9} className="text-[var(--color-ink-3)] inline" />
                        }
                      </span>
                    )}

                    {col.key === 'revenue' && (
                      <span className="font-[var(--font-mono)] tabular-nums text-[11px] text-[var(--color-ink-2)]">
                        {row.revenue > 0
                          ? formatCurrency(row.revenue)
                          : <Minus size={9} className="text-[var(--color-ink-3)] inline" />
                        }
                      </span>
                    )}

                    {col.key === 'roas' && <RoasBadge roas={row.roas} />}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    </div>
  )
}

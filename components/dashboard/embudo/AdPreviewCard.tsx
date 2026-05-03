'use client'

import { useState } from 'react'
import { Trophy, TrendingUp, DollarSign, MousePointerClick, Eye, Users } from 'lucide-react'
import { AdPreviewItem, MetaAdStatus } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_META: Record<MetaAdStatus, { label: string; color: string }> = {
  ACTIVE:   { label: 'Activo',   color: '#3DAB6E' },
  PAUSED:   { label: 'Pausado',  color: '#C9973A' },
  ARCHIVED: { label: 'Archivado', color: '#5C5650' },
  DELETED:  { label: 'Eliminado', color: '#D95F5F' },
  UNKNOWN:  { label: '—',        color: '#5C5650' },
}

function StatusBadge({ status }: { status: MetaAdStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.UNKNOWN
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-[var(--font-mono)] uppercase tracking-wider"
      style={{ background: meta.color + '1A', color: meta.color, border: `1px solid ${meta.color}33` }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

function MetricCell({ label, value, icon, accent }: { label: string; value: string; icon?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)] flex items-center gap-1">
        {icon}{label}
      </p>
      <p className={`text-xs font-semibold font-[var(--font-mono)] tabular-nums ${accent ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink)]'}`}>
        {value}
      </p>
    </div>
  )
}

// ── Ad card ───────────────────────────────────────────────────────────────────

interface AdPreviewCardProps {
  ad:                AdPreviewItem
  canViewFinancials: boolean
}

export function AdPreviewCard({ ad, canViewFinancials }: AdPreviewCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="
      flex flex-col rounded-[var(--radius-md)] border border-[var(--color-border)]
      bg-[var(--color-surface)] overflow-hidden
      hover:border-[var(--color-border-2)] transition-colors group
    ">
      {/* Thumbnail — aspect-square para mostrar más de la imagen */}
      <div className="relative aspect-square bg-[var(--color-surface-2)] overflow-hidden">
        {ad.thumbnail_url && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.thumbnail_url}
            alt={ad.ad_name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[var(--color-border)] flex items-center justify-center">
              <Eye size={16} className="text-[var(--color-ink-3)]" />
            </div>
            <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
              Sin preview
            </p>
          </div>
        )}

        {/* Status overlay */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={ad.status} />
        </div>

        {/* Ver en Meta link */}
        {ad.preview_link && (
          <a
            href={ad.preview_link}
            target="_blank"
            rel="noopener noreferrer"
            className="
              absolute bottom-2 right-2 px-2 py-1 rounded text-[9px] font-[var(--font-mono)]
              bg-black/60 text-white/80 hover:text-white hover:bg-black/80
              transition-all opacity-0 group-hover:opacity-100
            "
          >
            Ver en Meta ↗
          </a>
        )}
      </div>

      {/* Metadatos */}
      <div className="p-3 flex-1 flex flex-col gap-2">
        <div>
          <p className="text-xs font-medium text-[var(--color-ink)] line-clamp-2 leading-tight">
            {ad.ad_name}
          </p>
          {ad.campaign_name && (
            <p className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5 truncate">
              {ad.campaign_name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto pt-2 border-t border-[var(--color-border)]">
          <MetricCell label="CTR" value={ad.ctr > 0 ? `${ad.ctr.toFixed(2)}%` : '—'} />
          <MetricCell label="Leads" value={formatNumber(ad.conversions)} />
          {canViewFinancials && (
            <MetricCell label="Gasto" value={ad.spend > 0 ? formatCurrency(ad.spend) : '—'} accent />
          )}
        </div>

        {canViewFinancials && ad.cpl !== null && ad.cpl > 0 && (
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] uppercase tracking-wider">CPL</p>
            <p className="text-[10px] font-semibold font-[var(--font-mono)] text-[var(--color-ink)] tabular-nums">
              {formatCurrency(ad.cpl)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Top Anuncios ──────────────────────────────────────────────────────────────

const MEDAL_COLORS = ['#D4AF37', '#A8A8A8', '#CD7F32']

interface TopAdsTableProps {
  ads:               AdPreviewItem[]
  isLoading:         boolean
  canViewFinancials: boolean
}

export function TopAdsTable({ ads, isLoading, canViewFinancials }: TopAdsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-[var(--radius-md)]" />
        ))}
      </div>
    )
  }

  // Rankear por mejor CPL (menor gasto por lead), solo ads con conversiones > 0
  const ranked = [...ads]
    .filter((a) => a.conversions > 0 && a.spend > 0)
    .sort((a, b) => {
      const cplA = a.spend / a.conversions
      const cplB = b.spend / b.conversions
      return cplA - cplB
    })
    .slice(0, 10)

  if (ranked.length === 0) {
    return (
      <div className="py-8 flex flex-col items-center gap-2">
        <Trophy size={20} className="text-[var(--color-ink-3)]" />
        <p className="text-sm text-[var(--color-ink-2)]">Sin anuncios con conversiones en este período.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {ranked.map((ad, idx) => {
        const cpl = ad.spend / ad.conversions
        const isMedal = idx < 3
        return (
          <div
            key={`${ad.ad_id}-${idx}`}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)]
              border transition-colors
              ${idx === 0
                ? 'border-[#D4AF37]/30 bg-[#D4AF37]/5'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]'}
            `}
          >
            {/* Ranking */}
            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-[var(--font-mono)]"
              style={isMedal
                ? { background: MEDAL_COLORS[idx] + '20', color: MEDAL_COLORS[idx], border: `1px solid ${MEDAL_COLORS[idx]}40` }
                : { background: 'var(--color-surface-2)', color: 'var(--color-ink-3)' }
              }
            >
              {idx + 1}
            </div>

            {/* Thumbnail mini */}
            <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[var(--color-surface-2)]">
              {ad.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Eye size={12} className="text-[var(--color-ink-3)]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--color-ink)] truncate">{ad.ad_name}</p>
              <p className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] truncate">{ad.campaign_name}</p>
            </div>

            {/* Métricas */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-[8px] font-[var(--font-mono)] uppercase text-[var(--color-ink-3)] flex items-center gap-0.5 justify-end">
                  <Users size={8} />Leads
                </p>
                <p className="text-xs font-bold font-[var(--font-mono)] text-[var(--color-ink)] tabular-nums">
                  {formatNumber(ad.conversions)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-[var(--font-mono)] uppercase text-[var(--color-ink-3)] flex items-center gap-0.5 justify-end">
                  <MousePointerClick size={8} />CTR
                </p>
                <p className="text-xs font-bold font-[var(--font-mono)] text-[var(--color-ink)] tabular-nums">
                  {ad.ctr > 0 ? `${ad.ctr.toFixed(2)}%` : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-[var(--font-mono)] uppercase text-[var(--color-ink-3)] flex items-center gap-0.5 justify-end">
                  <TrendingUp size={8} />Clicks
                </p>
                <p className="text-xs font-bold font-[var(--font-mono)] text-[var(--color-ink)] tabular-nums">
                  {formatNumber(ad.clicks)}
                </p>
              </div>
              {canViewFinancials && (
                <>
                  <div className="text-right">
                    <p className="text-[8px] font-[var(--font-mono)] uppercase text-[var(--color-ink-3)] flex items-center gap-0.5 justify-end">
                      <DollarSign size={8} />Gasto
                    </p>
                    <p className="text-xs font-bold font-[var(--font-mono)] text-[var(--color-gold)] tabular-nums">
                      {formatCurrency(ad.spend)}
                    </p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="text-[8px] font-[var(--font-mono)] uppercase text-[var(--color-ink-3)]">CPL</p>
                    <p className={`text-xs font-bold font-[var(--font-mono)] tabular-nums ${idx === 0 ? 'text-[#3DAB6E]' : 'text-[var(--color-ink)]'}`}>
                      {formatCurrency(cpl)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Grid de ads ───────────────────────────────────────────────────────────────

interface AdPreviewGridProps {
  ads:               AdPreviewItem[]
  isLoading:         boolean
  canViewFinancials: boolean
}

export function AdPreviewGrid({ ads, isLoading, canViewFinancials }: AdPreviewGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-border)]">
            <div className="skeleton aspect-square" />
            <div className="p-3 space-y-2">
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (ads.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center gap-2">
        <p className="text-sm text-[var(--color-ink-2)]">Sin creativos en este período.</p>
        <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
          Los anuncios aparecen cuando Meta Ads está configurado
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {ads.map((ad, idx) => (
        <AdPreviewCard
          key={`${ad.ad_id}-${idx}`}
          ad={ad}
          canViewFinancials={canViewFinancials}
        />
      ))}
    </div>
  )
}

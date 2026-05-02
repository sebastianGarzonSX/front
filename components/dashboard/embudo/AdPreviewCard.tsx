'use client'

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

// ── Ad card ───────────────────────────────────────────────────────────────────

interface AdPreviewCardProps {
  ad:                AdPreviewItem
  canViewFinancials: boolean
}

export function AdPreviewCard({ ad, canViewFinancials }: AdPreviewCardProps) {
  return (
    <div className="
      flex flex-col rounded-[var(--radius-md)] border border-[var(--color-border)]
      bg-[var(--color-surface)] overflow-hidden
      hover:border-[var(--color-border-2)] transition-colors group
    ">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-[var(--color-surface-2)] overflow-hidden">
        {ad.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.thumbnail_url}
            alt={ad.ad_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[var(--color-border)] flex items-center justify-center">
              <span className="text-lg text-[var(--color-ink-3)]">▶</span>
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
        {/* Nombre del anuncio */}
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

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2 mt-auto pt-2 border-t border-[var(--color-border)]">
          <div>
            <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)]">CTR</p>
            <p className="text-xs font-semibold font-[var(--font-mono)] text-[var(--color-ink)] tabular-nums">
              {ad.ctr > 0 ? `${ad.ctr.toFixed(2)}%` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)]">Leads</p>
            <p className="text-xs font-semibold font-[var(--font-mono)] text-[var(--color-ink)] tabular-nums">
              {formatNumber(ad.conversions)}
            </p>
          </div>
          {canViewFinancials && (
            <div>
              <p className="text-[8px] font-[var(--font-mono)] uppercase tracking-wide text-[var(--color-ink-3)]">Gasto</p>
              <p className="text-xs font-semibold font-[var(--font-mono)] text-[var(--color-gold)] tabular-nums">
                {ad.spend > 0 ? formatCurrency(ad.spend) : '—'}
              </p>
            </div>
          )}
        </div>

        {/* CPL */}
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

// ── Grid de ads ───────────────────────────────────────────────────────────────

interface AdPreviewGridProps {
  ads:               AdPreviewItem[]
  isLoading:         boolean
  canViewFinancials: boolean
}

export function AdPreviewGrid({ ads, isLoading, canViewFinancials }: AdPreviewGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-border)]">
            <div className="skeleton aspect-[4/3]" />
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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

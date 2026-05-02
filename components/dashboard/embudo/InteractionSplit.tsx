'use client'

import { CRMStats } from '@/types'
import { formatNumber } from '@/components/dashboard/KPICard'

interface InteractionSplitProps {
  stats:     CRMStats | null
  isLoading: boolean
}

export function InteractionSplit({ stats, isLoading }: InteractionSplitProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-10 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-16 rounded" />
          <div className="skeleton h-16 rounded" />
        </div>
      </div>
    )
  }

  if (!stats || stats.total_leads === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-3)] text-center py-8">
        Sin datos de interacción.
      </p>
    )
  }

  const withPct    = stats.total_leads > 0 ? Math.round((stats.with_interaction / stats.total_leads) * 100) : 0
  const withoutPct = 100 - withPct

  return (
    <div className="space-y-4">
      {/* Barra dividida */}
      <div className="relative h-3 rounded-full overflow-hidden bg-[var(--color-border)] flex">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${withPct}%`, background: 'var(--color-green)' }}
        />
        <div
          className="h-full flex-1 transition-all duration-700"
          style={{ background: 'var(--color-ink-3)', opacity: 0.3 }}
        />
      </div>

      {/* Números */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-green-dim)] bg-[var(--color-green-dim)]/30">
          <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-green)] mb-1">
            Con interacción
          </p>
          <p className="text-2xl font-[var(--font-display)] font-bold text-[var(--color-green)] tabular-nums">
            {formatNumber(stats.with_interaction)}
          </p>
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-green)] mt-0.5 opacity-70">
            {withPct}% del total
          </p>
        </div>

        <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-2)]">
          <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-1">
            Lead frío
          </p>
          <p className="text-2xl font-[var(--font-display)] font-bold text-[var(--color-ink-2)] tabular-nums">
            {formatNumber(stats.without_interaction)}
          </p>
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5">
            {withoutPct}% sin respuesta
          </p>
        </div>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">
          Total leads
        </p>
        <p className="text-xs font-semibold font-[var(--font-mono)] text-[var(--color-ink)]">
          {formatNumber(stats.total_leads)}
        </p>
      </div>
    </div>
  )
}

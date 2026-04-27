'use client'

import { MetaTotals } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'
import { Eye, MousePointer, DollarSign, TrendingUp, Zap, Activity } from 'lucide-react'

interface MetaSummaryBarProps {
  data: MetaTotals | null
  isLoading: boolean
  metaEnabled: boolean
}

interface StatCellProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: boolean
}

function StatCell({ icon, label, value, sub, accent }: StatCellProps) {
  return (
    <div className={`
      flex-1 min-w-[120px] px-4 py-3 border-r border-[var(--color-border)] last:border-r-0
      group transition-colors duration-150
      ${accent ? 'bg-[var(--color-gold-glow)]' : 'hover:bg-[var(--color-surface-2)]'}
    `}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className={`${accent ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-3)]'}`}>
          {icon}
        </span>
        <p className="text-[9px] font-[var(--font-mono)] tracking-[0.12em] uppercase text-[var(--color-ink-3)]">
          {label}
        </p>
      </div>
      <p className={`
        font-[var(--font-mono)] text-base font-semibold leading-none
        ${accent ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink)]'}
      `}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[10px] text-[var(--color-ink-3)]">{sub}</p>
      )}
    </div>
  )
}

function StatCellSkeleton() {
  return (
    <div className="flex-1 min-w-[120px] px-4 py-3 border-r border-[var(--color-border)] last:border-r-0">
      <div className="skeleton h-2 w-16 rounded mb-2" />
      <div className="skeleton h-5 w-20 rounded" />
    </div>
  )
}

export function MetaSummaryBar({ data, isLoading, metaEnabled }: MetaSummaryBarProps) {
  if (!metaEnabled) {
    return (
      <div className="
        flex items-center gap-3 px-5 py-3.5
        bg-[var(--color-surface)] border border-[var(--color-border)] border-dashed rounded-[var(--radius-md)]
      ">
        <Zap size={14} className="text-[var(--color-gold-dim)] flex-shrink-0" />
        <p className="text-xs text-[var(--color-ink-3)]">
          Meta Ads no configurado.{' '}
          <span className="text-[var(--color-ink-2)]">
            Agrega <code className="font-[var(--font-mono)] text-[var(--color-gold-dim)]">META_ACCESS_TOKEN</code> y{' '}
            <code className="font-[var(--font-mono)] text-[var(--color-gold-dim)]">META_AD_ACCOUNT_ID</code> al backend para activar el cruce con GHL.
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="
      bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)]
      overflow-hidden
    ">
      {/* Header strip */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <Activity size={11} className="text-[var(--color-gold)]" />
        <p className="text-[9px] font-[var(--font-mono)] tracking-[0.2em] uppercase text-[var(--color-gold)]">
          Meta Ads — período seleccionado
        </p>
      </div>

      {/* Stats row */}
      <div className="flex overflow-x-auto">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCellSkeleton key={i} />)
        ) : (
          <>
            <StatCell
              icon={<DollarSign size={11} />}
              label="Gasto"
              value={formatCurrency(data?.total_spend ?? 0)}
              accent
            />
            <StatCell
              icon={<Eye size={11} />}
              label="Impresiones"
              value={formatNumber(data?.total_impressions ?? 0)}
            />
            <StatCell
              icon={<MousePointer size={11} />}
              label="Clics"
              value={formatNumber(data?.total_clicks ?? 0)}
            />
            <StatCell
              icon={<TrendingUp size={11} />}
              label="CTR"
              value={`${(data?.avg_ctr ?? 0).toFixed(2)}%`}
              sub="click-through rate"
            />
            <StatCell
              icon={<DollarSign size={11} />}
              label="CPM"
              value={formatCurrency(data?.avg_cpm ?? 0)}
              sub="por mil impresiones"
            />
            <StatCell
              icon={<Zap size={11} />}
              label="Conv. Meta"
              value={formatNumber(data?.total_conversions_meta ?? 0)}
              sub="reportadas por Meta"
            />
          </>
        )}
      </div>
    </div>
  )
}

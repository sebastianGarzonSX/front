'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  label: string
  value: string | number
  /** Porcentaje de cambio respecto al período anterior. Positivo = subida. */
  delta?: number
  /** Texto descriptivo del período de comparación */
  deltaLabel?: string
  /** Sublínea informativa debajo del valor */
  sublabel?: string
  isLoading?: boolean
  /** Si es false, muestra valor oculto (para viewer sin acceso a financieros) */
  visible?: boolean
  /** Icono decorativo de Lucide */
  icon?: React.ReactNode
}

export function KPICard({
  label,
  value,
  delta,
  deltaLabel = 'vs mes anterior',
  sublabel,
  isLoading = false,
  visible = true,
  icon,
}: KPICardProps) {
  if (isLoading) return <KPICardSkeleton />

  const deltaPositive = delta !== undefined && delta > 0
  const deltaNegative = delta !== undefined && delta < 0
  const deltaZero     = delta !== undefined && delta === 0

  return (
    <article className="
      relative p-5 rounded-[var(--radius-md)]
      bg-[var(--color-surface)] border border-[var(--color-border)]
      hover:border-[var(--color-border-2)] transition-colors duration-200
      animate-fade-up
    ">
      {/* Icono decorativo */}
      {icon && (
        <div className="absolute top-4 right-4 text-[var(--color-ink-3)] opacity-60">
          {icon}
        </div>
      )}

      {/* Label */}
      <p className="text-[10px] font-[var(--font-mono)] tracking-[0.15em] uppercase text-[var(--color-ink-2)] mb-3">
        {label}
      </p>

      {/* Valor principal */}
      <p className="font-[var(--font-display)] text-3xl font-semibold text-[var(--color-ink)] leading-none">
        {visible ? value : <span className="blur-sm select-none">••••</span>}
      </p>

      {/* Sublabel */}
      {sublabel && (
        <p className="mt-1.5 text-xs text-[var(--color-ink-3)]">{sublabel}</p>
      )}

      {/* Delta */}
      {delta !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className={`
            flex items-center gap-1 text-xs font-medium font-[var(--font-mono)]
            ${deltaPositive ? 'text-[var(--color-green)]' : deltaNegative ? 'text-[var(--color-red)]' : 'text-[var(--color-ink-3)]'}
          `}>
            {deltaPositive && <TrendingUp size={12} />}
            {deltaNegative && <TrendingDown size={12} />}
            {deltaZero && <Minus size={12} />}
            {deltaPositive ? '+' : ''}{delta.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[var(--color-ink-3)]">{deltaLabel}</span>
        </div>
      )}

      {/* Línea de acento inferior */}
      <div className="
        absolute bottom-0 left-0 right-0 h-px
        bg-gradient-to-r from-transparent via-[var(--color-gold-dim)] to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity
      " />
    </article>
  )
}

function KPICardSkeleton() {
  return (
    <div className="p-5 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3">
      <div className="skeleton h-2.5 w-20 rounded" />
      <div className="skeleton h-8 w-28 rounded" />
      <div className="skeleton h-2 w-16 rounded" />
    </div>
  )
}

/** Formatea un número con separadores de miles (1234567 → 1.234.567) */
export function formatNumber(n: number): string {
  return n.toLocaleString('es-CO')
}

/** Formatea un valor monetario en COP u otra moneda */
export function formatCurrency(n: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

/** Formatea un valor monetario con 2 decimales (uso para CPL, CPC, métricas unitarias) */
export function formatCurrencyDecimal(n: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

/** Calcula el delta % entre dos valores */
export function calcDelta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

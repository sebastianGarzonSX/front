'use client'

import { CRMStats } from '@/types'
import { MessageCircle, MessageCircleOff } from 'lucide-react'

interface InteractionBarProps {
  stats:     CRMStats | null | undefined
  isLoading: boolean
}

export function InteractionBar({ stats, isLoading }: InteractionBarProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3">
        <div className="skeleton h-14 flex-1 rounded-[var(--radius-sm)]" />
        <div className="skeleton h-14 flex-1 rounded-[var(--radius-sm)]" />
      </div>
    )
  }

  const total   = stats?.total_leads         ?? 0
  const withInt = stats?.with_interaction    ?? 0
  const without = stats?.without_interaction ?? 0
  const pctWith = total > 0 ? Math.round((withInt / total) * 100) : 0
  const pctNo   = total > 0 ? Math.round((without / total) * 100) : 0

  return (
    <div className="flex gap-3">
      {/* Con interacción */}
      <div className="
        flex-1 flex items-center gap-3 px-4 py-3
        bg-[var(--color-surface)] border border-[var(--color-border)]
        rounded-[var(--radius-sm)]
      ">
        <div className="w-8 h-8 rounded flex items-center justify-center bg-[var(--color-green-dim)] flex-shrink-0">
          <MessageCircle size={16} className="text-[var(--color-green)]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] uppercase tracking-wide">
            Con interacción
          </p>
          <p className="text-lg font-semibold font-[var(--font-display)] text-[var(--color-ink)] leading-tight tabular-nums">
            {withInt.toLocaleString()}
            <span className="text-xs font-normal text-[var(--color-ink-3)] ml-1.5">{pctWith}%</span>
          </p>
        </div>
        {/* Mini bar */}
        <div className="ml-auto w-24 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-[var(--color-green)] rounded-full transition-all duration-700"
            style={{ width: `${pctWith}%` }}
          />
        </div>
      </div>

      {/* Sin interacción */}
      <div className="
        flex-1 flex items-center gap-3 px-4 py-3
        bg-[var(--color-surface)] border border-[var(--color-border)]
        rounded-[var(--radius-sm)]
      ">
        <div className="w-8 h-8 rounded flex items-center justify-center bg-[var(--color-surface-2)] flex-shrink-0">
          <MessageCircleOff size={16} className="text-[var(--color-ink-3)]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] uppercase tracking-wide">
            Sin interacción
          </p>
          <p className="text-lg font-semibold font-[var(--font-display)] text-[var(--color-ink)] leading-tight tabular-nums">
            {without.toLocaleString()}
            <span className="text-xs font-normal text-[var(--color-ink-3)] ml-1.5">{pctNo}%</span>
          </p>
        </div>
        <div className="ml-auto w-24 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-[var(--color-ink-3)] rounded-full transition-all duration-700"
            style={{ width: `${pctNo}%` }}
          />
        </div>
      </div>
    </div>
  )
}

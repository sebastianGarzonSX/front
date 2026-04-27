'use client'

import { AttributionByTag } from '@/types'
import { formatNumber } from '@/components/dashboard/KPICard'
import { Tag } from 'lucide-react'

interface TagsDistributionProps {
  tags: AttributionByTag[]
  isLoading: boolean
}

const TAG_PALETTE = [
  'var(--color-gold)',
  '#A07820',
  '#7A5A18',
  '#3DAB6E',
  '#5C9FD4',
  '#8B6EBF',
  '#D4875C',
]

export function TagsDistribution({ tags, isLoading }: TagsDistributionProps) {
  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-3 w-32 rounded" />
            <div className="skeleton h-1.5 flex-1 rounded-full" />
            <div className="skeleton h-3 w-8 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (tags.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-3)] text-center py-8">
        Sin tags en el período.
      </p>
    )
  }

  const max = Math.max(...tags.map((t) => t.total_leads), 1)

  return (
    <div className="space-y-2">
      {tags.map((tag, i) => {
        const pct = Math.round((tag.total_leads / max) * 100)
        const color = TAG_PALETTE[i % TAG_PALETTE.length]

        return (
          <div key={tag.tag} className="flex items-center gap-3 group">
            {/* Tag label */}
            <div className="flex items-center gap-1.5 w-40 flex-shrink-0">
              <Tag size={10} className="flex-shrink-0" style={{ color }} />
              <p
                className="text-[11px] text-[var(--color-ink-2)] truncate group-hover:text-[var(--color-ink)] transition-colors"
                title={tag.tag}
              >
                {tag.tag}
              </p>
            </div>

            {/* Proportional bar */}
            <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>

            {/* Count */}
            <span className="text-[10px] font-[var(--font-mono)] tabular-nums text-[var(--color-ink)] w-8 text-right flex-shrink-0">
              {formatNumber(tag.total_leads)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

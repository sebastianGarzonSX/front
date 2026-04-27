'use client'

import { useDashboardKPIs } from '@/hooks/useDashboardKPIs'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = [
  'var(--color-gold)',
  '#A07820',
  '#7A5A18',
  '#3DAB6E',
  '#5C9EE0',
  '#9B6BB5',
]

export function SourcesChart() {
  const { data, isLoading } = useDashboardKPIs()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="skeleton w-32 h-32 rounded-full" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-3 rounded" style={{ width: `${50 + i * 10}%` }} />
          ))}
        </div>
      </div>
    )
  }

  const sources = data?.leads.by_source ?? []
  const total = sources.reduce((sum, s) => sum + s.count, 0)

  if (sources.length === 0) {
    return (
      <p className="text-sm text-[var(--color-ink-3)] text-center py-8">
        Sin datos de fuentes.
      </p>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie
            data={sources}
            dataKey="count"
            nameKey="source"
            cx="50%"
            cy="50%"
            innerRadius={36}
            outerRadius={56}
            paddingAngle={3}
            strokeWidth={0}
          >
            {sources.map((_, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-2)',
              borderRadius: '4px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-ink)',
            }}
            formatter={(value) => [`${Number(value)} leads`, '']}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex-1 space-y-2 min-w-0">
        {sources.map((source, index) => {
          const pct = total > 0 ? ((source.count / total) * 100).toFixed(1) : '0'
          return (
            <div key={source.source} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: COLORS[index % COLORS.length] }}
              />
              <p className="text-xs text-[var(--color-ink-2)] flex-1 truncate">
                {source.source || 'Desconocido'}
              </p>
              <p className="text-xs font-[var(--font-mono)] text-[var(--color-ink)] flex-shrink-0">
                {source.count}
              </p>
              <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] w-10 text-right flex-shrink-0">
                {pct}%
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

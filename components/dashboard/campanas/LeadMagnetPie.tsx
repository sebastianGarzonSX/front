'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { LMDistItem } from '@/types'
import { formatNumber } from '@/components/dashboard/KPICard'

interface LeadMagnetPieProps {
  items:     LMDistItem[]
  isLoading: boolean
}

const COLORS = ['#C9973A', '#5C9FD4', '#3DAB6E', '#8B6EBF', '#D4875C', '#A07820', '#2D8A5A']

function cleanLabel(tag: string) {
  // lm_aumento_ventas → Aumento ventas
  return tag
    .replace(/^lm_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function LeadMagnetPie({ items, isLoading }: LeadMagnetPieProps) {
  if (isLoading) {
    return <div className="skeleton h-48 rounded-[var(--radius-md)]" />
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xs text-[var(--color-ink-3)]">Sin datos de lead magnet</p>
        <p className="text-[10px] text-[var(--color-ink-3)] mt-1 font-[var(--font-mono)]">
          Los leads deben tener etiquetas con prefijo <code>lm_</code>
        </p>
      </div>
    )
  }

  const data = items.map((item) => ({
    name:  cleanLabel(item.lm_tag),
    value: item.count,
    pct:   item.pct,
    tag:   item.lm_tag,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--color-ink)',
            }}
            formatter={(value) => [
              `${formatNumber(Number(value ?? 0))} leads`,
              '',
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend manual */}
      <div className="space-y-1.5 mt-2">
        {data.map((item, i) => (
          <div key={item.tag} className="flex items-center gap-2.5">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <p className="text-xs text-[var(--color-ink)] flex-1 truncate">{item.name}</p>
            <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-2)] tabular-nums">
              {formatNumber(item.value)}
            </span>
            <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] tabular-nums w-9 text-right">
              {item.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

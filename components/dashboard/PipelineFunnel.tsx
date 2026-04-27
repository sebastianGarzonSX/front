'use client'

import { usePipelineStages } from '@/hooks/useOpportunities'
import { UserProfile } from '@/types'
import { formatCurrency } from './KPICard'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface PipelineFunnelProps {
  user: UserProfile
}

const BAR_COLORS = [
  'var(--color-gold)',
  '#A07820',
  '#7A5A18',
  '#604810',
  '#483810',
  '#302810',
]

export function PipelineFunnel({ user }: PipelineFunnelProps) {
  const { data, isLoading, error } = usePipelineStages()
  const canViewFinancials = user.role !== 'viewer'

  if (isLoading) return <PipelineSkeleton />

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-red)]">
        Error al cargar pipeline: {error}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-ink-3)]">
        Sin datos de pipeline.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Gráfico de barras */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="30%" barSize={20}>
          <XAxis
            dataKey="stage_name"
            tick={{ fill: 'var(--color-ink-3)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'var(--color-surface-2)' }}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-2)',
              borderRadius: '4px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-ink)',
            }}
            formatter={(value, _name, props) => {
              const stage = props.payload as { total_value: number }
              const count = Number(value)
              return [
                <span key="count">{count} oportunidades</span>,
                canViewFinancials ? formatCurrency(stage.total_value) : '',
              ]
            }}
            labelStyle={{ color: 'var(--color-gold)', fontWeight: 600 }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={BAR_COLORS[index % BAR_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Lista de stages con porcentajes */}
      <div className="space-y-2">
        {data.map((stage, index) => (
          <div key={stage.stage_name} className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: BAR_COLORS[index % BAR_COLORS.length] }}
            />
            <p className="text-xs text-[var(--color-ink-2)] flex-1 truncate">
              {stage.stage_name}
            </p>
            <p className="text-xs font-[var(--font-mono)] text-[var(--color-ink)] flex-shrink-0">
              {stage.count}
            </p>
            <div className="w-16 h-1 bg-[var(--color-border)] rounded-full flex-shrink-0">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${stage.percentage}%`,
                  background: BAR_COLORS[index % BAR_COLORS.length],
                }}
              />
            </div>
            <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] w-8 text-right flex-shrink-0">
              {stage.percentage.toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PipelineSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-[200px] w-full rounded" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton w-2 h-2 rounded-full" />
          <div className="skeleton h-3 flex-1 rounded" />
          <div className="skeleton h-3 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}

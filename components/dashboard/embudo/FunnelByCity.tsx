'use client'

import { useState, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { TrendingDown, TrendingUp, Thermometer, Target, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { FunnelByCityResponse, FunnelStageKey, PipelineType } from '@/types'
import { formatCurrency, formatNumber } from '@/components/dashboard/KPICard'
import type { FunnelStep } from './Funnel3DCanvas'

const Funnel3DCanvas = dynamic(() => import('./Funnel3DCanvas'), {
  ssr:     false,
  loading: () => (
    <div className="w-full flex items-center justify-center" style={{ height: 'clamp(340px,48vh,480px)' }}>
      <div className="space-y-2 w-full px-8">
        {[100, 82, 64, 46, 30, 18].map((w, i) => (
          <div key={i} className="skeleton rounded-sm mx-auto" style={{ height: 42, width: `${w}%` }} />
        ))}
      </div>
    </div>
  ),
})

// ── Colores ───────────────────────────────────────────────────────────────────

const STAGE_COLORS: Record<FunnelStageKey, string> = {
  cold:       '#5C6870',
  interacted: '#5C9FD4',
  survey:     '#8B6EBF',
  decision:   '#C9973A',
  payment:    '#D4875C',
  won:        '#3DAB6E',
}
const AUTO_COLORS = ['#5C9FD4', '#8B6EBF', '#C9973A', '#D4875C', '#3DAB6E', '#5C6870']

// ── PipelineTypeToggle ───────────────────────────────────────────────────────

interface PipelineToggleProps {
  value:    PipelineType
  onChange: (v: PipelineType) => void
}

export function PipelineTypeToggle({ value, onChange }: PipelineToggleProps) {
  return (
    <div className="flex items-center gap-1 p-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)] border border-[var(--color-border)]">
      {(['registro', 'venta'] as PipelineType[]).map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={`
            px-3 py-1 rounded-sm text-[10px] font-[var(--font-mono)] uppercase tracking-wider transition-all
            ${value === type
              ? 'bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm'
              : 'text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]'}
          `}
        >
          {type === 'registro' ? 'Registro' : 'Venta'}
        </button>
      ))}
    </div>
  )
}

// ── StageList — clickable, izquierda ──────────────────────────────────────────

function StageList({
  steps, selectedIdx, onSelect, canViewFinancials,
}: {
  steps:             FunnelStep[]
  selectedIdx:       number | null
  onSelect:          (idx: number) => void
  canViewFinancials: boolean
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-[0.18em] text-[var(--color-ink-3)] mb-2 px-2">
        Etapas
      </p>
      {steps.map((step, i) => {
        const isActive = selectedIdx === i
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`
              w-full text-left rounded-[var(--radius-sm)] px-3 py-2 transition-all
              border ${isActive
                ? 'bg-[var(--color-surface-2)]'
                : 'bg-transparent border-transparent hover:bg-[var(--color-surface-2)]/50'}
            `}
            style={isActive
              ? { borderColor: step.color + '55', boxShadow: `inset 2px 0 0 0 ${step.color}` }
              : undefined
            }
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: step.color }} />
              <span className="text-[10px] font-[var(--font-mono)] uppercase tracking-wider truncate"
                style={{ color: isActive ? step.color : 'var(--color-ink-2)' }}>
                {step.label}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 pl-3.5">
              <span className="text-base font-semibold font-[var(--font-display)] tabular-nums leading-none text-[var(--color-ink)]">
                {formatNumber(step.count)}
              </span>
              {step.convPct !== undefined && (
                <span className="text-[10px] font-[var(--font-mono)] tabular-nums"
                  style={{
                    color: step.convPct >= 50 ? 'var(--color-green)'
                         : step.convPct >= 20 ? 'var(--color-gold)'
                         : 'var(--color-red)',
                  }}>
                  {step.convPct.toFixed(0)}%
                </span>
              )}
            </div>
            {canViewFinancials && step.costPer && (
              <div className="pl-3.5 mt-0.5">
                <span className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
                  {formatCurrency(step.costPer)} / lead
                </span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Detail panel (derecha) ────────────────────────────────────────────────────

function temperatureLabel(convPct: number | undefined): { label: string; icon: React.ReactNode; color: string; tone: string } {
  if (convPct === undefined) {
    return { label: 'Inicio del funnel',  icon: <Target size={14} />,         color: '#5C9FD4', tone: 'Punto de entrada' }
  }
  if (convPct >= 70) return { label: 'Caliente',         icon: <CheckCircle2 size={14} />,  color: '#3DAB6E', tone: 'Excelente conversión' }
  if (convPct >= 40) return { label: 'Tibio',            icon: <Thermometer size={14} />,   color: '#C9973A', tone: 'Conversión moderada' }
  if (convPct >= 15) return { label: 'Frío',             icon: <TrendingDown size={14} />,  color: '#D4875C', tone: 'Punto de fricción' }
                     return { label: 'Crítico',          icon: <AlertTriangle size={14} />, color: '#D95F5F', tone: 'Fuga de leads alta' }
}

function StageDetail({
  step, prevStep, canViewFinancials,
}: {
  step:              FunnelStep | null
  prevStep:          FunnelStep | null
  canViewFinancials: boolean
}) {
  if (!step) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-6 flex flex-col items-center text-center gap-2">
        <Target size={20} className="text-[var(--color-ink-3)]" />
        <p className="text-xs text-[var(--color-ink-2)]">Seleccioná una etapa del embudo</p>
        <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">click o tap en cualquier nivel</p>
      </div>
    )
  }

  const temp     = temperatureLabel(step.convPct)
  const drop     = prevStep ? prevStep.count - step.count : null
  const dropPct  = prevStep && prevStep.count > 0 ? (drop! / prevStep.count) * 100 : null

  return (
    <div
      className="rounded-[var(--radius-md)] border bg-[var(--color-surface)] overflow-hidden"
      style={{ borderColor: step.color + '40', borderTopColor: step.color, borderTopWidth: 2 }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: step.color, boxShadow: `0 0 6px ${step.color}` }} />
          <span className="text-[10px] font-[var(--font-mono)] uppercase tracking-[0.18em]" style={{ color: step.color }}>
            {step.label}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-semibold font-[var(--font-display)] tabular-nums leading-none text-[var(--color-ink)]">
            {formatNumber(step.count)}
          </p>
          <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">leads</span>
        </div>
        {step.pctTotal !== undefined && (
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-1">
            {step.pctTotal.toFixed(1)}% del total
          </p>
        )}
      </div>

      {/* Temperatura */}
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-1.5">
          Temperatura de respuesta
        </p>
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)]"
          style={{ background: temp.color + '1A', border: `1px solid ${temp.color}44` }}
        >
          <span style={{ color: temp.color }}>{temp.icon}</span>
          <span className="text-xs font-semibold" style={{ color: temp.color }}>{temp.label}</span>
        </div>
        <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-1.5">
          {temp.tone}
        </p>
      </div>

      {/* Conversión + Caída */}
      {step.convPct !== undefined && (
        <div className="px-4 py-3 border-b border-[var(--color-border)] grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-0.5">
              Conversión
            </p>
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-semibold font-[var(--font-display)] tabular-nums leading-none"
                style={{
                  color: step.convPct >= 50 ? 'var(--color-green)'
                       : step.convPct >= 20 ? 'var(--color-gold)'
                       : 'var(--color-red)',
                }}>
                {step.convPct.toFixed(1)}%
              </p>
              <TrendingUp size={12} className="text-[var(--color-ink-3)]" />
            </div>
            <p className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5">
              desde {prevStep?.label.toLowerCase() ?? 'anterior'}
            </p>
          </div>

          {dropPct !== null && drop !== null && drop > 0 && (
            <div>
              <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-0.5">
                Fuga
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-semibold font-[var(--font-display)] tabular-nums leading-none text-[var(--color-red)]">
                  −{dropPct.toFixed(0)}%
                </p>
                <TrendingDown size={12} className="text-[var(--color-red)]/60" />
              </div>
              <p className="text-[9px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-0.5">
                {formatNumber(drop)} leads perdidos
              </p>
            </div>
          )}
        </div>
      )}

      {/* Costo */}
      {canViewFinancials && step.costPer && (
        <div className="px-4 py-3">
          <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)] mb-0.5">
            Costo por lead en esta etapa
          </p>
          <p className="text-2xl font-semibold font-[var(--font-display)] tabular-nums leading-none"
            style={{ color: '#C9973A' }}>
            {formatCurrency(step.costPer)}
          </p>
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] mt-1">
            gasto Meta ÷ leads en este nivel
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface FunnelByCityProps {
  data:              FunnelByCityResponse | null
  isLoading:         boolean
  canViewFinancials: boolean
}

export function FunnelByCity({ data, isLoading, canViewFinancials }: FunnelByCityProps) {

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  // ── Steps memoizados (estables para Three.js) ─────────────────────────────
  const steps = useMemo<FunnelStep[]>(() => {
    if (!data) return []
    const spend      = canViewFinancials ? data.meta_spend : 0
    const firstCount = data.stages[0]?.count ?? 0

    return data.stages.map((s, i) => {
      const prev    = i > 0 ? data.stages[i - 1] : null
      const convPct = prev && prev.count > 0 ? (s.count / prev.count) * 100 : undefined
      const costPer = spend > 0 && s.count > 0 ? spend / s.count : undefined
      const pctTotal = firstCount > 0 ? (s.count / firstCount) * 100 : undefined
      return {
        label:    s.stage_name,
        count:    s.count,
        color:    STAGE_COLORS[s.stage_key] ?? AUTO_COLORS[i % AUTO_COLORS.length],
        costPer,
        convPct,
        pctTotal,
      }
    })
  }, [data, canViewFinancials])

  // Auto-seleccionar primera etapa cuando llega data
  useEffect(() => {
    if (steps.length > 0 && selectedIdx === null) {
      setSelectedIdx(0)
    }
    if (steps.length > 0 && selectedIdx !== null && selectedIdx >= steps.length) {
      setSelectedIdx(0)
    }
  }, [steps, selectedIdx])

  // ── Loading / empty ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-[var(--radius-md)]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 space-y-2">
            {[0,1,2,3,4].map((i) => <div key={i} className="skeleton h-14 rounded-[var(--radius-sm)]" />)}
          </div>
          <div className="lg:col-span-5"><div className="skeleton w-full" style={{ height: 'clamp(340px,48vh,480px)', borderRadius: 8 }} /></div>
          <div className="lg:col-span-4"><div className="skeleton w-full h-64 rounded-[var(--radius-md)]" /></div>
        </div>
      </div>
    )
  }

  if (!data || data.stages.length === 0) {
    return (
      <div className="py-14 flex flex-col items-center gap-2">
        <p className="text-sm text-[var(--color-ink-2)]">Sin datos de embudo para esta selección.</p>
        <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">Seleccioná una ciudad y un rango de fechas</p>
      </div>
    )
  }

  // ── Derivados ──────────────────────────────────────────────────────────────
  const spend     = canViewFinancials ? data.meta_spend : 0
  const cplTotal  = spend > 0 && data.total_leads > 0 ? spend / data.total_leads : 0
  const selStep   = selectedIdx !== null ? steps[selectedIdx] : null
  const prevStep  = selectedIdx !== null && selectedIdx > 0 ? steps[selectedIdx - 1] : null

  return (
    <div className="space-y-5">

      {/* ── KPI strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="relative p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
          style={{ borderTopColor: '#1877F2', borderTopWidth: 2 }}>
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
            style={{ background: '#1877F222', color: '#1877F2' }}>↗</div>
          <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">Total leads</p>
          <p className="text-xl font-semibold font-[var(--font-display)] tabular-nums leading-none mt-1" style={{ color: '#1877F2' }}>
            {formatNumber(data.total_leads)}
          </p>
        </div>

        {canViewFinancials && spend > 0 ? (
          <div className="relative p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
            style={{ borderTopColor: '#F59E0B', borderTopWidth: 2 }}>
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
              style={{ background: '#F59E0B22', color: '#F59E0B' }}>$</div>
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">Gasto Meta</p>
            <p className="text-xl font-semibold font-[var(--font-display)] tabular-nums leading-none mt-1" style={{ color: '#F59E0B' }}>
              {formatCurrency(spend)}
            </p>
          </div>
        ) : <div />}

        {canViewFinancials && cplTotal > 0 ? (
          <div className="relative p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden col-span-2 sm:col-span-1"
            style={{ borderTopColor: '#8B5CF6', borderTopWidth: 2 }}>
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
              style={{ background: '#8B5CF622', color: '#8B5CF6' }}>÷</div>
            <p className="text-[9px] font-[var(--font-mono)] uppercase tracking-widest text-[var(--color-ink-3)]">CPL total</p>
            <p className="text-xl font-semibold font-[var(--font-display)] tabular-nums leading-none mt-1" style={{ color: '#8B5CF6' }}>
              {formatCurrency(cplTotal)}
            </p>
          </div>
        ) : <div />}
      </div>

      {/* ── Layout 3 columnas ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Lista de etapas — orden 2 en mobile (después del funnel) */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <StageList
            steps={steps}
            selectedIdx={selectedIdx}
            onSelect={setSelectedIdx}
            canViewFinancials={canViewFinancials}
          />
        </div>

        {/* Embudo 3D — primero en mobile, centro en desktop */}
        <div className="lg:col-span-5 order-1 lg:order-2">
          <Funnel3DCanvas
            steps={steps}
            selectedIdx={selectedIdx}
            onSelect={setSelectedIdx}
          />
        </div>

        {/* Panel de detalle — orden 3 en ambos */}
        <div className="lg:col-span-4 order-3 lg:order-3">
          <div className="lg:sticky lg:top-4">
            <StageDetail
              step={selStep}
              prevStep={prevStep}
              canViewFinancials={canViewFinancials}
            />
          </div>
        </div>

      </div>

    </div>
  )
}

'use client'

import { useState } from 'react'
import { useLeads } from '@/hooks/useLeads'
import { Lead, LeadStage } from '@/types'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

const STAGE_LABELS: Record<LeadStage, string> = {
  new:         'Nuevo',
  contacted:   'Contactado',
  qualified:   'Calificado',
  proposal:    'Propuesta',
  negotiation: 'Negociación',
  won:         'Ganado',
  lost:        'Perdido',
}

const STAGE_COLORS: Record<LeadStage, string> = {
  new:         'bg-[var(--color-border)] text-[var(--color-ink-2)]',
  contacted:   'bg-blue-900/30 text-blue-400',
  qualified:   'bg-amber-900/30 text-amber-400',
  proposal:    'bg-purple-900/30 text-purple-400',
  negotiation: 'bg-orange-900/30 text-orange-400',
  won:         'bg-[var(--color-green-dim)]/40 text-[var(--color-green)]',
  lost:        'bg-[var(--color-red-dim)]/40 text-[var(--color-red)]',
}

const PAGE_SIZE = 10

export function LeadsTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<LeadStage | ''>('')

  const { data, isLoading, error } = useLeads({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    stage: stageFilter || undefined,
  })

  const totalPages = data?.meta.total_pages ?? 1

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-[var(--color-border)]">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-3)]"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="
              w-full pl-9 pr-3 py-2
              bg-[var(--color-surface-2)] border border-[var(--color-border-2)]
              rounded-[var(--radius-sm)] text-sm text-[var(--color-ink)]
              placeholder:text-[var(--color-ink-3)]
              focus:outline-none focus:border-[var(--color-gold)]/50
            "
          />
        </div>

        <select
          value={stageFilter}
          onChange={(e) => { setStageFilter(e.target.value as LeadStage | ''); setPage(1) }}
          className="
            px-3 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border-2)]
            rounded-[var(--radius-sm)] text-sm text-[var(--color-ink)]
            focus:outline-none focus:border-[var(--color-gold)]/50
          "
        >
          <option value="">Todos los stages</option>
          {(Object.keys(STAGE_LABELS) as LeadStage[]).map((stage) => (
            <option key={stage} value={stage}>{STAGE_LABELS[stage]}</option>
          ))}
        </select>

        {data && (
          <p className="self-center text-xs text-[var(--color-ink-3)] font-[var(--font-mono)] whitespace-nowrap">
            {data.meta.total} leads
          </p>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Nombre', 'Email', 'Fuente', 'Stage', 'Fecha'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-[10px] font-medium tracking-widest uppercase text-[var(--color-ink-3)]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)]/50">
                  {[72, 60, 50, 40, 55].map((w, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="skeleton h-3 rounded" style={{ width: `${w}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            )}

            {!isLoading && error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-red)]">
                  Error al cargar leads: {error}
                </td>
              </tr>
            )}

            {!isLoading && !error && data?.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-ink-3)]">
                  No se encontraron leads.
                </td>
              </tr>
            )}

            {!isLoading && !error && data?.data.map((lead) => (
              <LeadRow key={lead.id} lead={lead} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {!isLoading && data && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-ink-3)] font-[var(--font-mono)]">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-1">
            <PaginationButton
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              icon={<ChevronLeft size={14} />}
            />
            <PaginationButton
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              icon={<ChevronRight size={14} />}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <tr className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-surface-2)] transition-colors duration-100">
      <td className="px-4 py-3.5 font-medium text-[var(--color-ink)]">
        {lead.name}
      </td>
      <td className="px-4 py-3.5 text-[var(--color-ink-2)] font-[var(--font-mono)] text-xs">
        {lead.email ?? '—'}
      </td>
      <td className="px-4 py-3.5 text-[var(--color-ink-2)]">
        {lead.source ?? '—'}
      </td>
      <td className="px-4 py-3.5">
        <span className={`
          inline-block px-2 py-0.5 rounded-sm text-[10px] font-medium tracking-wide
          ${STAGE_COLORS[lead.stage]}
        `}>
          {STAGE_LABELS[lead.stage]}
        </span>
      </td>
      <td className="px-4 py-3.5 text-xs text-[var(--color-ink-3)] font-[var(--font-mono)] whitespace-nowrap">
        {new Date(lead.created_at).toLocaleDateString('es', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </td>
    </tr>
  )
}

function PaginationButton({
  onClick,
  disabled,
  icon,
}: {
  onClick: () => void
  disabled: boolean
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="
        p-1.5 rounded-[var(--radius-sm)]
        border border-[var(--color-border-2)] text-[var(--color-ink-2)]
        hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]
        disabled:opacity-30 disabled:cursor-not-allowed
        transition-colors duration-150
      "
    >
      {icon}
    </button>
  )
}

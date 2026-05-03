'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, ChevronDown, Check } from 'lucide-react'
import type { CampaignOption } from '@/hooks/useCampaignList'

interface CampaignSelectorProps {
  campaigns:  CampaignOption[]
  selected:   string[]
  onChange:    (ids: string[]) => void
  isLoading:  boolean
}

function formatSpend(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export function CampaignSelector({ campaigns, selected, onChange, isLoading }: CampaignSelectorProps) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = campaigns.filter(
    (c) => !search || c.campaign_name.toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    )
  }

  const selectedNames = campaigns
    .filter((c) => selected.includes(c.campaign_id))
    .map((c) => c.campaign_name)

  const label = selected.length === 0
    ? 'Todas las campañas'
    : selected.length === 1
      ? selectedNames[0]
      : `${selected.length} campañas`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-[var(--font-mono)] border
          transition-all duration-150 max-w-[320px]
          ${selected.length > 0
            ? 'bg-[#1877F2]/10 border-[#1877F2]/30 text-[#1877F2]'
            : 'border-[var(--color-border)] text-[var(--color-ink-3)] hover:text-[var(--color-ink-2)] hover:border-[var(--color-border-2)]'}
        `}
      >
        <span className="truncate">{isLoading ? 'Cargando…' : label}</span>
        {selected.length > 0 && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange([]) }}
            className="flex-shrink-0 hover:text-[var(--color-red)] cursor-pointer"
          >
            <X size={10} />
          </span>
        )}
        <ChevronDown size={10} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="
          absolute top-full left-0 mt-1 z-50
          w-[380px] max-h-[360px] flex flex-col
          bg-[var(--color-surface)] border border-[var(--color-border)]
          rounded-[var(--radius-md)] shadow-lg overflow-hidden
        ">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--color-border)]">
            <Search size={12} className="text-[var(--color-ink-3)] flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar campaña…"
              autoFocus
              className="
                flex-1 bg-transparent text-xs text-[var(--color-ink)]
                placeholder:text-[var(--color-ink-3)] outline-none
                font-[var(--font-mono)]
              "
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-[var(--color-ink-3)] hover:text-[var(--color-ink)]">
                <X size={10} />
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-3)] text-center py-6 font-[var(--font-mono)]">
                {isLoading ? 'Cargando campañas…' : 'Sin campañas para este período'}
              </p>
            ) : (
              filtered.map((c) => {
                const isSelected = selected.includes(c.campaign_id)
                return (
                  <button
                    key={c.campaign_id}
                    onClick={() => toggle(c.campaign_id)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 text-left
                      transition-colors duration-100
                      ${isSelected
                        ? 'bg-[#1877F2]/8'
                        : 'hover:bg-[var(--color-surface-2)]'}
                    `}
                  >
                    <div className={`
                      w-4 h-4 rounded-sm border flex-shrink-0
                      flex items-center justify-center transition-all
                      ${isSelected
                        ? 'bg-[#1877F2] border-[#1877F2]'
                        : 'border-[var(--color-border)] bg-transparent'}
                    `}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>

                    <span className="flex-1 text-[11px] text-[var(--color-ink)] truncate leading-tight">
                      {c.campaign_name}
                    </span>

                    <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] tabular-nums flex-shrink-0">
                      {formatSpend(c.spend)}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-[var(--color-border)] flex items-center justify-between">
              <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
                {selected.length} seleccionada{selected.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => onChange([])}
                className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] hover:text-[var(--color-red)]"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

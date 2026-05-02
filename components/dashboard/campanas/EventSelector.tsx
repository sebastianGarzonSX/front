'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { EventTag } from '@/types'
import { ChevronDown, Tag, X } from 'lucide-react'

interface EventSelectorProps {
  tags:      EventTag[]
  selected:  string | null
  onChange:  (tag: string | null) => void
  isLoading: boolean
}

export function EventSelector({ tags, selected, onChange, isLoading }: EventSelectorProps) {
  const [open, setOpen]   = useState(false)
  const [rect, setRect]   = useState<DOMRect | null>(null)
  const btnRef  = useRef<HTMLButtonElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const updateRect = useCallback(() => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect())
  }, [])

  const toggle = () => {
    updateRect()
    setOpen((v) => !v)
  }

  useEffect(() => {
    if (!open) return
    const onScroll = () => updateRect()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, updateRect])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        dropRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const label = selected
    ? (tags.find((t) => t.tag === selected)?.tag ?? selected)
    : 'Todos los eventos'

  const dropdown = open && rect ? (
    <div
      ref={dropRef}
      style={{
        position:  'fixed',
        top:       rect.bottom + 4,
        left:      rect.left,
        minWidth:  Math.max(rect.width, 240),
        zIndex:    99999,
      }}
      className="
        bg-[var(--color-surface)] border border-[var(--color-border)]
        rounded-[var(--radius-md)] shadow-2xl overflow-hidden
      "
    >
      <button
        onClick={() => { onChange(null); setOpen(false) }}
        className={`
          w-full flex items-center justify-between px-3 py-2.5
          text-sm hover:bg-[var(--color-surface-2)] transition-colors
          ${!selected ? 'text-[var(--color-gold)] font-medium' : 'text-[var(--color-ink)]'}
        `}
      >
        <span>Todos los eventos</span>
        {!selected && (
          <span className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">activo</span>
        )}
      </button>

      {tags.length > 0 && (
        <div className="border-t border-[var(--color-border)]">
          <p className="px-3 py-1.5 text-[9px] font-[var(--font-mono)] tracking-widest uppercase text-[var(--color-ink-3)]">
            Etiquetas detectadas
          </p>
          <div className="max-h-60 overflow-y-auto">
            {tags.map((t) => (
              <button
                key={t.tag}
                onClick={() => { onChange(t.tag); setOpen(false) }}
                className={`
                  w-full flex items-center justify-between px-3 py-2
                  text-sm hover:bg-[var(--color-surface-2)] transition-colors
                  ${selected === t.tag ? 'text-[var(--color-gold)] font-medium' : 'text-[var(--color-ink)]'}
                `}
              >
                <span className="truncate text-left">{t.tag}</span>
                <span className="ml-2 flex-shrink-0 text-[10px] font-[var(--font-mono)] px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-ink-3)] tabular-nums">
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tags.length === 0 && !isLoading && (
        <p className="px-3 py-4 text-xs text-[var(--color-ink-3)] text-center">
          Sin etiquetas en el período
        </p>
      )}
    </div>
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        disabled={isLoading}
        className="
          flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)]
          bg-[var(--color-surface)] border border-[var(--color-border)]
          hover:border-[var(--color-gold)] transition-colors
          text-sm text-[var(--color-ink)] font-medium
          disabled:opacity-50 disabled:cursor-not-allowed
          min-w-[180px]
        "
      >
        <Tag size={13} className="text-[var(--color-gold)] flex-shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        {selected && (
          <X
            size={12}
            className="text-[var(--color-ink-3)] hover:text-[var(--color-red)] flex-shrink-0"
            onClick={(e) => { e.stopPropagation(); onChange(null); setOpen(false) }}
          />
        )}
        <ChevronDown
          size={13}
          className={`text-[var(--color-ink-3)] flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {typeof document !== 'undefined' && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </>
  )
}

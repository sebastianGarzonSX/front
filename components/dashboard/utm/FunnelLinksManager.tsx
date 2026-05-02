'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { Plus, Trash2, ExternalLink, Loader2 } from 'lucide-react'

export interface FunnelLink {
  id: string
  label: string
  base_url: string
  category: string
  created_at: string
}

const CATEGORIES = [
  { value: 'clase',   label: 'Clase en Vivo',  emoji: '🎓' },
  { value: 'evento',  label: 'Evento',         emoji: '📍' },
  { value: 'hotmart', label: 'Hotmart',        emoji: '🔥' },
  { value: 'general', label: 'General',        emoji: '🔗' },
]

interface Props {
  links: FunnelLink[]
  loading: boolean
  onRefresh: () => void
}

export function FunnelLinksManager({ links, loading, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel]       = useState('')
  const [baseUrl, setBaseUrl]   = useState('')
  const [category, setCategory] = useState('general')
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleSave() {
    if (!label.trim() || !baseUrl.trim()) return
    setSaving(true)
    try {
      const res = await apiFetch('/api/utm/funnel-links', {
        method: 'POST',
        body: JSON.stringify({ label: label.trim(), base_url: baseUrl.trim(), category }),
      })
      if (res.ok) {
        setLabel('')
        setBaseUrl('')
        setCategory('general')
        setShowForm(false)
        onRefresh()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await apiFetch(`/api/utm/funnel-links/${id}`, { method: 'DELETE' })
      onRefresh()
    } catch { /* ignore */ }
    setDeleting(null)
  }

  return (
    <div className="max-w-3xl">
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">Links de Embudos</h3>
            <p className="text-[10px] text-[var(--color-ink-3)] mt-0.5">
              Guarda aquí las URLs base de tus embudos para reutilizarlas al generar UTMs.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              bg-[var(--color-gold-glow)] text-[var(--color-gold)] hover:bg-[var(--color-gold)] hover:text-[var(--color-canvas)]
            "
          >
            <Plus size={13} />
            Agregar embudo
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="mb-5 p-4 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-3)] font-medium mb-1">
                Nombre del embudo
              </label>
              <input
                type="text"
                placeholder="Ej: Registro Clase en Vivo"
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="
                  w-full px-3 py-2 rounded-lg text-sm
                  bg-[var(--color-surface)] border border-[var(--color-border)]
                  text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)]
                  focus:outline-none focus:border-[var(--color-gold-dim)] focus:ring-1 focus:ring-[var(--color-gold-dim)]
                  transition-all
                "
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-3)] font-medium mb-1">
                URL base
              </label>
              <input
                type="url"
                placeholder="https://tu-pagina.com/registro"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                className="
                  w-full px-3 py-2 rounded-lg text-sm font-mono
                  bg-[var(--color-surface)] border border-[var(--color-border)]
                  text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)]
                  focus:outline-none focus:border-[var(--color-gold-dim)] focus:ring-1 focus:ring-[var(--color-gold-dim)]
                  transition-all
                "
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-ink-3)] font-medium mb-1">
                Categoría
              </label>
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                      ${category === cat.value
                        ? 'border-[var(--color-gold)] bg-[var(--color-gold-glow)] text-[var(--color-gold)]'
                        : 'border-[var(--color-border)] text-[var(--color-ink-2)] hover:border-[var(--color-gold-dim)]'
                      }
                    `}
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                disabled={!label.trim() || !baseUrl.trim() || saving}
                className="
                  flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all
                  disabled:opacity-30 disabled:cursor-not-allowed
                  bg-[var(--color-gold)] text-[var(--color-canvas)] hover:opacity-90
                "
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Guardar
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="
                  px-4 py-2 rounded-lg text-xs font-medium transition-all
                  border border-[var(--color-border)] text-[var(--color-ink-3)]
                  hover:border-[var(--color-ink-3)] hover:text-[var(--color-ink-2)]
                "
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Links list */}
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 size={20} className="animate-spin mx-auto text-[var(--color-ink-3)]" />
          </div>
        ) : links.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-[var(--color-ink-3)]">
              No tienes embudos guardados. Agrega uno para empezar a generar URLs rápidamente.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map(link => {
              const cat = CATEGORIES.find(c => c.value === link.category) ?? CATEGORIES[3]
              return (
                <div
                  key={link.id}
                  className="
                    flex items-center gap-3 p-3 rounded-lg
                    bg-[var(--color-canvas)] border border-[var(--color-border)]
                    group hover:border-[var(--color-border-2)] transition-all
                  "
                >
                  <span className="text-base flex-shrink-0">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[var(--color-ink)] truncate">{link.label}</p>
                      <span className="
                        text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded
                        bg-[var(--color-surface-2)] text-[var(--color-ink-3)]
                      ">
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--color-ink-3)] truncate mt-0.5">{link.base_url}</p>
                  </div>
                  <a
                    href={link.base_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex-shrink-0 p-1.5 rounded-md transition-all
                      text-[var(--color-ink-3)] hover:text-[var(--color-gold)] hover:bg-[var(--color-gold-glow)]
                      opacity-0 group-hover:opacity-100
                    "
                  >
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => handleDelete(link.id)}
                    disabled={deleting === link.id}
                    className="
                      flex-shrink-0 p-1.5 rounded-md transition-all
                      text-[var(--color-ink-3)] hover:text-[var(--color-red)] hover:bg-[rgba(255,80,80,0.1)]
                      opacity-0 group-hover:opacity-100
                      disabled:opacity-50
                    "
                  >
                    {deleting === link.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

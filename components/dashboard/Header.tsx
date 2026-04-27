'use client'

import { UserProfile } from '@/types'
import { RefreshCw } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useState, useEffect, useCallback } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
  user: UserProfile
  lastSynced?: string
}

export function Header({ title, subtitle, user, lastSynced }: HeaderProps) {
  const canSync = user.role === 'admin'

  const [syncing,  setSyncing]  = useState(false)
  const [syncMode, setSyncMode] = useState<'incremental' | 'full' | null>(null)

  // Consulta el estado real del servidor para saber si hay un sync en curso
  const checkStatus = useCallback(async () => {
    if (!canSync) return
    try {
      const res  = await apiFetch('/api/sync/status')
      const body = await res.json() as { running: boolean }
      setSyncing(body.running)
      if (!body.running) setSyncMode(null)
    } catch {
      // ignorar errores de red al chequear estado
    }
  }, [canSync])

  // Chequea estado al montar y cada 5 s mientras haya sync en curso
  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  useEffect(() => {
    if (!syncing) return
    const id = setInterval(checkStatus, 5_000)
    return () => clearInterval(id)
  }, [syncing, checkStatus])

  async function handleSync(e: React.MouseEvent) {
    if (syncing) return
    const full = e.shiftKey
    setSyncing(true)
    setSyncMode(full ? 'full' : 'incremental')
    try {
      const res = await apiFetch(`/api/sync${full ? '?full=true' : ''}`, { method: 'POST' })
      if (res.status === 409) {
        // Ya había un sync — el servidor lo confirmó, mantener estado visual
      }
    } catch {
      setSyncing(false)
      setSyncMode(null)
    }
  }

  return (
    <header className="
      flex items-center justify-between
      px-6 py-4
      border-b border-[var(--color-border)]
      bg-[var(--color-surface)]
    ">
      <div>
        <h1 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)] leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs text-[var(--color-ink-2)]">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {lastSynced && (
          <p className="hidden sm:block text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)]">
            Sync:{' '}
            <span className="text-[var(--color-ink-2)]">
              {formatRelativeTime(lastSynced)}
            </span>
          </p>
        )}

        {canSync && (
          <div className="flex flex-col items-end gap-0.5">
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`
                flex items-center gap-1.5 px-3 py-1.5
                border rounded-[var(--radius-sm)]
                text-xs transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                ${syncMode === 'full'
                  ? 'border-[var(--color-gold)] text-[var(--color-gold)] bg-[var(--color-gold-glow)]'
                  : 'border-[var(--color-border-2)] text-[var(--color-ink-2)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]'}
              `}
              title="Click: sync incremental  |  Shift+Click: sync completo (todos los datos)"
            >
              <RefreshCw size={12} strokeWidth={1.5} className={syncing ? 'animate-spin' : ''} />
              {syncing
                ? (syncMode === 'full' ? 'Sync completo…' : 'Sincronizando…')
                : 'Sincronizar'}
            </button>
            {!syncing && (
              <p className="text-[8px] text-[var(--color-ink-3)] font-[var(--font-mono)]">
                Shift+Click para sync completo
              </p>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)

  if (minutes < 1) return 'ahora mismo'
  if (minutes < 60) return `hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  return date.toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

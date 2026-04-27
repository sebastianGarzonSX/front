'use client'

import { useActionState } from 'react'
import { signIn } from '@/app/actions/auth'

type LoginState = { error?: string } | null

export function LoginForm({ initialError }: { initialError?: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    async (_prev: LoginState, formData: FormData) => {
      await signIn(formData)
      return null
    },
    initialError ? { error: initialError } : null
  )

  const errorMessage =
    state?.error === 'invalid_credentials'
      ? 'Email o contraseña incorrectos.'
      : state?.error === 'missing_fields'
        ? 'Completa todos los campos.'
        : state?.error
          ? 'Ocurrió un error. Intenta de nuevo.'
          : null

  return (
    <form action={formAction} className="space-y-4">
      {errorMessage && (
        <div className="border border-[var(--color-red-dim)] bg-[var(--color-red-dim)]/30 rounded-[var(--radius-sm)] px-4 py-3 text-sm text-[var(--color-red)]">
          {errorMessage}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-medium tracking-widest uppercase text-[var(--color-ink-2)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="diana@empresa.com"
          className="
            w-full bg-[var(--color-surface-2)] border border-[var(--color-border-2)]
            rounded-[var(--radius-sm)] px-4 py-3
            text-[var(--color-ink)] text-sm font-[var(--font-mono)]
            placeholder:text-[var(--color-ink-3)]
            focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/30
            transition-colors duration-150
            disabled:opacity-50
          "
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-xs font-medium tracking-widest uppercase text-[var(--color-ink-2)]"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="
            w-full bg-[var(--color-surface-2)] border border-[var(--color-border-2)]
            rounded-[var(--radius-sm)] px-4 py-3
            text-[var(--color-ink)] text-sm font-[var(--font-mono)]
            placeholder:text-[var(--color-ink-3)]
            focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]/30
            transition-colors duration-150
            disabled:opacity-50
          "
          disabled={isPending}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="
          w-full mt-2 py-3 px-4
          bg-[var(--color-gold)] hover:bg-[var(--color-gold-dim)]
          text-[var(--color-canvas)] font-semibold text-sm tracking-wide
          rounded-[var(--radius-sm)]
          transition-all duration-150
          disabled:opacity-60 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50
          relative overflow-hidden
        "
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Iniciando sesión…
          </span>
        ) : (
          'Iniciar sesión'
        )}
      </button>
    </form>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

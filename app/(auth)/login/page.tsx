import { LoginForm } from '@/components/auth/LoginForm'

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* ── Panel izquierdo — identidad de marca ── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[var(--color-surface)] overflow-hidden">
        {/* Rejilla decorativa de fondo */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-ink) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Círculo de acento */}
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-[var(--color-gold)] opacity-[0.04] blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <span className="font-[var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
            Diana Cortés
          </span>
          <span className="ml-2 text-xs tracking-[0.2em] uppercase text-[var(--color-gold)] font-[var(--font-mono)]">
            Dashboard
          </span>
        </div>

        {/* Número hero */}
        <div className="relative z-10 space-y-6">
          <p className="font-[var(--font-display)] text-[clamp(3.5rem,6vw,5.5rem)] leading-none font-semibold text-[var(--color-ink)] opacity-90">
            Todas tus<br />métricas,<br />
            <span className="text-[var(--color-gold)]">un solo lugar.</span>
          </p>
          <p className="text-[var(--color-ink-2)] text-sm max-w-xs leading-relaxed">
            GoHighLevel · Pipeline · Leads · Conversión.<br />
            Datos en tiempo real para decisiones más rápidas.
          </p>
        </div>

        {/* Tagline de pie */}
        <div className="relative z-10">
          <p className="text-[var(--color-ink-3)] text-xs font-[var(--font-mono)] tracking-widest">
            © {new Date().getFullYear()} — Uso interno
          </p>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex items-center justify-center p-8 bg-[var(--color-canvas)]">
        <div className="w-full max-w-sm space-y-8 animate-fade-up">
          {/* Cabecera móvil */}
          <div className="lg:hidden text-center">
            <span className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
              Diana Cortés
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="font-[var(--font-display)] text-3xl font-semibold text-[var(--color-ink)] tracking-tight">
              Bienvenida
            </h1>
            <p className="text-sm text-[var(--color-ink-2)]">
              Ingresa tus credenciales para acceder al panel.
            </p>
          </div>

          <LoginForm initialError={error} />

          <p className="text-center text-xs text-[var(--color-ink-3)]">
            ¿Problemas para acceder?{' '}
            <a
              href="mailto:tecnologia.sabiduria@gmail.com"
              className="text-[var(--color-gold)] hover:underline"
            >
              Contacta al administrador
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}

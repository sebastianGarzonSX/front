'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { UserProfile, ROLE_PERMISSIONS } from '@/types'
import {
  BarChart2,
  TrendingUp,
  LogOut,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  permission?: keyof (typeof ROLE_PERMISSIONS)['admin']
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Campañas',
    href: '/dashboard/campanas',
    icon: <BarChart2 size={16} strokeWidth={1.5} />,
  },
  {
    label: 'AdsManager PRO',
    href: '/dashboard/adsmanager',
    icon: <TrendingUp size={16} strokeWidth={1.5} />,
  },
]

interface SidebarProps {
  user: UserProfile
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const permissions = ROLE_PERMISSIONS[user.role]

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permission || permissions[item.permission]
  )

  return (
    <aside className="
      w-56 flex-shrink-0 flex flex-col
      bg-[var(--color-surface)] border-r border-[var(--color-border)]
      h-full
    ">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--color-border)]">
        <p className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink)] leading-none">
          Diana Cortés
        </p>
        <p className="mt-0.5 text-[10px] font-[var(--font-mono)] tracking-[0.18em] uppercase text-[var(--color-gold)]">
          Dashboard
        </p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)]
                text-sm transition-all duration-150
                ${
                  isActive
                    ? 'bg-[var(--color-gold-glow)] text-[var(--color-gold)] font-medium'
                    : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]'
                }
              `}
            >
              <span className={isActive ? 'text-[var(--color-gold)]' : 'text-[var(--color-ink-3)] group-hover:text-[var(--color-ink-2)]'}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight size={12} className="text-[var(--color-gold-dim)]" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer — usuario */}
      <div className="p-3 border-t border-[var(--color-border)]">
        <div className="px-3 py-2.5 mb-1">
          <p className="text-xs font-medium text-[var(--color-ink)] truncate">{user.name}</p>
          <p className="text-[10px] font-[var(--font-mono)] text-[var(--color-ink-3)] truncate">{user.email}</p>
          <span className="
            inline-block mt-1.5 px-1.5 py-0.5 rounded-sm
            text-[9px] uppercase tracking-widest font-medium
            bg-[var(--color-border)] text-[var(--color-ink-2)]
          ">
            {user.role}
          </span>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="
              w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-sm)]
              text-sm text-[var(--color-ink-3)] hover:text-[var(--color-red)] hover:bg-[var(--color-red-dim)]/20
              transition-all duration-150
            "
          >
            <LogOut size={15} strokeWidth={1.5} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}

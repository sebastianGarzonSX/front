'use client'

import { SidebarProvider, useSidebar } from './SidebarContext'
import { Sidebar } from './Sidebar'
import { UserProfile } from '@/types'

function ShellInner({
  user,
  children,
}: {
  user: UserProfile
  children: React.ReactNode
}) {
  const { isOpen, close } = useSidebar()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-canvas)]">
      {/* Backdrop móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — drawer en mobile, fijo en desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30
          lg:relative lg:translate-x-0
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <Sidebar user={user} />
      </div>

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}

export function DashboardShell({
  user,
  children,
}: {
  user: UserProfile
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <ShellInner user={user}>{children}</ShellInner>
    </SidebarProvider>
  )
}

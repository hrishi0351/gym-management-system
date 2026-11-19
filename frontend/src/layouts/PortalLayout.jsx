import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ExternalLink, LogOut, Menu, X } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import useAuth from '../hooks/useAuth.js'

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand text-on-brand' : 'text-muted hover:bg-surface-2 hover:text-fg'
  }`

function SidebarNav({ nav, label, onNavigate }) {
  return (
    <nav aria-label={label} className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {nav.map(({ to, label: text, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} onClick={onNavigate} className={linkClass}>
              <Icon size={18} aria-hidden="true" />
              {text}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SidebarFooter({ onNavigate }) {
  return (
    <div className="border-t border-line p-3">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <ExternalLink size={18} aria-hidden="true" />
        View website
      </Link>
    </div>
  )
}

export default function PortalLayout({ nav, area }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user, logout } = useAuth()
  const closeRef = useRef(null)

  useEffect(() => {
    if (!drawerOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [drawerOpen])

  const closeDrawer = () => setDrawerOpen(false)

  const handleLogout = async () => {
    await logout() // ProtectedRoute then sends the user to /login
    toast.success('Logged out')
  }

  return (
    <div className="min-h-screen">
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Logo />
        </div>
        <SidebarNav nav={nav} label={area} />
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={closeDrawer} aria-hidden="true" />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`${area} menu`}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface shadow-2xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Logo />
              <button
                ref={closeRef}
                type="button"
                onClick={closeDrawer}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <SidebarNav nav={nav} label={area} onNavigate={closeDrawer} />
            <SidebarFooter onNavigate={closeDrawer} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-page/85 px-4 backdrop-blur sm:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-fg lg:hidden"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <p className="hidden text-sm text-muted lg:block">{area}</p>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <span className="hidden text-sm sm:block">
              {user.firstName} {user.lastName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
            >
              <LogOut size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sr-only sm:hidden">Logout</span>
            </button>
          </div>
        </header>

        <main id="portal-main" className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
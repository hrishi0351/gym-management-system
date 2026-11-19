import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  BadgeCheck, CalendarCheck, CalendarDays, Dumbbell, ExternalLink, History, Inbox, LayoutDashboard,
  LogOut, Mail, Menu, Tag, TrendingUp, User, Users, Wallet, X,
} from 'lucide-react'
import Logo from '../components/Logo.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import useAuth from '../hooks/useAuth.js'

const NAV = [
  { heading: 'Overview', items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    heading: 'People',
    items: [
      { to: '/admin/members', label: 'Members', icon: Users },
      { to: '/admin/trainers', label: 'Trainers', icon: Dumbbell },
    ],
  },
  {
    heading: 'Business',
    items: [
      { to: '/admin/plans', label: 'Plans', icon: Tag },
      { to: '/admin/memberships', label: 'Memberships', icon: BadgeCheck },
      { to: '/admin/payments', label: 'Payments', icon: Wallet },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
      { to: '/admin/classes', label: 'Classes', icon: CalendarDays },
      { to: '/admin/enquiries', label: 'Enquiries', icon: Inbox },
      { to: '/admin/messages', label: 'Messages', icon: Mail },
    ],
  },
  {
    heading: 'Insights',
    items: [
      { to: '/admin/reports', label: 'Reports', icon: TrendingUp },
      { to: '/admin/activity-logs', label: 'Activity log', icon: History },
    ],
  },
]

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-brand text-on-brand' : 'text-muted hover:bg-surface-2 hover:text-fg'
  }`

function SidebarNav({ onNavigate }) {
  return (
    <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV.map((group) => (
        <div key={group.heading}>
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest text-muted">{group.heading}</p>
          <ul className="space-y-1">
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} onClick={onNavigate} className={linkClass}>
                  <Icon size={18} aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SidebarFooter({ onNavigate }) {
  return (
    <div className="space-y-1 border-t border-line p-3">
      <NavLink to="/admin/profile" onClick={onNavigate} className={linkClass}>
        <User size={18} aria-hidden="true" />
        My profile
      </NavLink>
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

export default function AdminLayout() {
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
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex h-16 items-center border-b border-line px-5">
          <Logo />
        </div>
        <SidebarNav />
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={closeDrawer} aria-hidden="true" />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
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
            <SidebarNav onNavigate={closeDrawer} />
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
          <p className="hidden text-sm text-muted lg:block">Admin panel</p>

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

        <main id="admin-main" className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import useAuth from '../hooks/useAuth.js'
import { buttonClasses } from './ui/buttonStyles.js'
import { NAV_LINKS, ROLE_HOME } from '../utils/constants.js'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'text-brand' : 'text-muted hover:text-fg'}`

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const close = () => setOpen(false)

  const authButtons = user ? (
    <Link to={ROLE_HOME[user.role] || '/'} onClick={close} className={buttonClasses({ size: 'sm' })}>
      Dashboard
    </Link>
  ) : (
    <>
      <Link to="/login" onClick={close} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
        Login
      </Link>
      <Link to="/register" onClick={close} className={buttonClasses({ size: 'sm' })}>
        Join now
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <div className="hidden items-center gap-2 lg:flex">{authButtons}</div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-surface text-fg lg:hidden"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-page lg:hidden">
          <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={close} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-2 border-t border-line pt-3">{authButtons}</div>
          </nav>
        </div>
      )}
    </header>
  )
}
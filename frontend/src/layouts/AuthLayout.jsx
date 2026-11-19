import { Link, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { APP_NAME, TAGLINE } from '../utils/constants.js'

export default function AuthLayout() {
  const location = useLocation()

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#0a0e15] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-orange-500/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-orange-600/20 blur-3xl" />
        <div className="relative">
          <Logo inverted />
        </div>
        <div className="relative">
          <h2 className="font-display text-6xl font-extrabold uppercase leading-none">{TAGLINE}</h2>
          <p className="mt-5 max-w-md text-lg text-white/70">
            Manage your membership, book classes and follow your progress, all in one place.
          </p>
        </div>
        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} {APP_NAME}</p>
      </aside>

      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link to="/" className="hidden text-sm font-medium text-muted hover:text-brand lg:block">
            ← Back to website
          </Link>
          <ThemeToggle compact />
        </div>
        <main className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
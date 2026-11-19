import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import Logo from './Logo.jsx'
import { APP_NAME, CONTACT, NAV_LINKS, TAGLINE } from '../utils/constants.js'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted">
            {TAGLINE} Modern equipment, expert coaches and a community that keeps you going.
          </p>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV_LINKS.slice(1).map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-muted transition-colors hover:text-brand">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">Members</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/login" className="text-muted transition-colors hover:text-brand">Member login</Link></li>
            <li><Link to="/register" className="text-muted transition-colors hover:text-brand">Create an account</Link></li>
            <li><Link to="/membership-registration" className="text-muted transition-colors hover:text-brand">Membership registration</Link></li>
            <li><Link to="/privacy" className="text-muted transition-colors hover:text-brand">Privacy policy</Link></li>
            <li><Link to="/terms" className="text-muted transition-colors hover:text-brand">Terms and conditions</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg font-bold uppercase tracking-wide">Visit us</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />{CONTACT.address}</li>
            <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />{CONTACT.phone}</li>
            <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />{CONTACT.email}</li>
            <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />{CONTACT.hours}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
      </div>
    </footer>
  )
}
import { BadgeCheck, CalendarCheck, CalendarDays, LayoutDashboard, User, Users, Wallet } from 'lucide-react'

export const MEMBER_NAV = [
  { to: '/member', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/member/membership', label: 'My membership', icon: BadgeCheck },
  { to: '/member/payments', label: 'Payments', icon: Wallet },
  { to: '/member/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/member/classes', label: 'Classes', icon: CalendarDays },
  { to: '/member/profile', label: 'My profile', icon: User },
]

export const TRAINER_NAV = [
  { to: '/trainer', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/trainer/members', label: 'My members', icon: Users },
  { to: '/trainer/classes', label: 'My classes', icon: CalendarDays },
  { to: '/trainer/profile', label: 'My profile', icon: User },
]
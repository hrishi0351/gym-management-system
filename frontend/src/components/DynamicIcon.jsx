import {
  CalendarCheck, Car, Clock, Coffee, Dumbbell, Heart, Lock, ShieldCheck,
  Sparkles, Target, TrendingUp, Users, Wind, Zap,
} from 'lucide-react'

const ICONS = { CalendarCheck, Car, Clock, Coffee, Dumbbell, Heart, Lock, ShieldCheck, Target, TrendingUp, Users, Wind, Zap }

export default function DynamicIcon({ name, size = 22, ...props }) {
  const Icon = ICONS[name] || Sparkles
  return <Icon size={size} aria-hidden="true" {...props} />
}
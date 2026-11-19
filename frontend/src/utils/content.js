import { APP_NAME } from './constants.js'

// Edit these two before going live, and have your legal text reviewed by a professional.
export const LEGAL = { updated: '15 November 2026', jurisdiction: 'Maharashtra, India' }

export const HOME_FEATURES = [
  { icon: 'Dumbbell', title: 'Premium equipment', text: 'Well-maintained machines, free weights and a functional zone for every kind of workout.' },
  { icon: 'Users', title: 'Expert coaches', text: 'Certified trainers who build a plan around your goals and keep you accountable.' },
  { icon: 'CalendarCheck', title: 'Classes every week', text: 'Yoga, HIIT, strength, dance and more. Active members can book spots online.' },
  { icon: 'TrendingUp', title: 'Track everything', text: 'See your membership, payments and attendance in your own online dashboard.' },
]

// SAMPLE CONTENT: replace with real member feedback (with their permission).
export const TESTIMONIALS = [
  { name: 'Aarav S.', text: 'The trainers notice your progress and adjust the plan. Booking classes online makes it easy to stay consistent.' },
  { name: 'Priya N.', text: 'Clean, spacious and never overcrowded. The morning yoga class is the best start to my day.' },
  { name: 'Rohan M.', text: 'I like that I can check my membership and payments online instead of chasing the front desk.' },
]

export const ABOUT = {
  story: [
    `${APP_NAME} was built around a simple idea: a gym should feel motivating, not intimidating. Whether you are lifting for the first time or training for a competition, you deserve good equipment, honest coaching and a clean space.`,
    'Our coaches design programs around your goals, your schedule and your current fitness level. We keep the floor uncrowded, the equipment maintained and the atmosphere friendly.',
    'Behind the scenes, we use a modern management system so memberships, payments, attendance and class bookings stay simple for both members and staff.',
  ],
  included: [
    'A free fitness assessment with a trainer (ask at the front desk)',
    'Strength, cardio and functional training zones',
    'Group classes for every level',
    'Online dashboard for your membership, payments and attendance',
    'Clean locker rooms and friendly staff',
  ],
  values: [
    { icon: 'Target', title: 'Results first', text: 'Clear goals, measurable progress and plans that adapt as you improve.' },
    { icon: 'ShieldCheck', title: 'Safety always', text: 'Correct form, proper warm-ups and well-maintained equipment.' },
    { icon: 'Heart', title: 'Community', text: 'A welcoming space where every member is encouraged, whatever their level.' },
    { icon: 'Clock', title: 'Consistency', text: 'Flexible timings and easy booking help you keep showing up.' },
  ],
}

export const PLAN_FAQS = [
  {
    q: 'How do I start my membership?',
    a: 'Choose a plan and send a membership request. Our team will contact you, and your membership is created at the front desk. It becomes active once your first payment is recorded and your start date arrives.',
  },
  {
    q: 'Can I pay in parts?',
    a: 'Yes. Our front desk can record part payments. Your membership activates after the first payment, and your dashboard always shows the balance still due.',
  },
  {
    q: 'Can I book group classes?',
    a: 'Active members can book classes up to 14 days ahead from their dashboard, as long as seats are available.',
  },
  {
    q: 'Can I visit before joining?',
    a: 'Of course. Send us a message from the Contact page and we will arrange a tour of the gym.',
  },
  {
    q: 'How do I renew my membership?',
    a: 'Contact the front desk before your expiry date. A renewal starts the day after your current membership ends, so you never lose a day.',
  },
]
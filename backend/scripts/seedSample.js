'use strict';

const crypto = require('crypto');
const config = require('../src/config/env');
const db = require('../src/config/db');
const { addDays } = require('../src/utils/dates');
const membershipModel = require('../src/models/membership.model');
const memberService = require('../src/services/member.service');
const trainerService = require('../src/services/trainer.service');
const membershipService = require('../src/services/membership.service');
const classService = require('../src/services/class.service');
const membershipJob = require('../src/jobs/membershipJob');

const DOMAIN = 'sample.gym.local';
const emailOf = (first, last) => `${first}.${last}`.toLowerCase() + `@${DOMAIN}`;

const TRAINERS = [
  { first: 'Rahul', last: 'Patil', phone: '9810000001', specialization: 'Strength and Conditioning', years: 8,
    bio: 'Former state-level powerlifter focused on safe, progressive strength training.', certs: 'ACE CPT, CSCS' },
  { first: 'Meera', last: 'Iyer', phone: '9810000002', specialization: 'Yoga and Mobility', years: 6,
    bio: 'Certified yoga instructor who blends flexibility work with mindful movement.', certs: 'RYT-500' },
  { first: 'Arjun', last: 'Rao', phone: '9810000003', specialization: 'HIIT and Cardio', years: 5,
    bio: 'High-energy coach for fat loss, endurance and functional fitness.', certs: 'NASM CPT' },
];

// start = days from today (negative = in the past); pay: 'full' | 'half' | null
const MEMBERS = [
  { first: 'Aarav', last: 'Sharma', phone: '9820000001', gender: 'male', dob: '1992-03-14', plan: 'Yearly', start: -60, pay: 'full', method: 'upi' },
  { first: 'Priya', last: 'Nair', phone: '9820000002', gender: 'female', dob: '1996-07-22', plan: 'Quarterly', start: -30, pay: 'half', method: 'cash' },
  { first: 'Rohan', last: 'Mehta', phone: '9820000003', gender: 'male', dob: '1990-11-05', plan: 'Monthly', start: -10, pay: 'full', method: 'cash' },
  { first: 'Sneha', last: 'Kulkarni', phone: '9820000004', gender: 'female', dob: '1994-01-30', plan: 'Half-Yearly', start: -90, pay: 'full', method: 'card' },
  { first: 'Vikram', last: 'Singh', phone: '9820000005', gender: 'male', dob: '1988-09-18', plan: 'Monthly', start: -75, pay: 'full', method: 'cash' }, // expired
  { first: 'Neha', last: 'Joshi', phone: '9820000006', gender: 'female', dob: '1998-05-09', plan: 'Monthly', start: 0, pay: null, method: 'cash' }, // pending, unpaid
  { first: 'Karan', last: 'Patel', phone: '9820000007', gender: 'male', dob: '1993-12-21', plan: 'Quarterly', start: -20, pay: 'full', method: 'upi' },
  { first: 'Isha', last: 'Verma', phone: '9820000008', gender: 'female', dob: '1999-02-14', plan: null, start: 0, pay: null, method: 'cash' }, // no membership
];

const t = (day, start, end) => ({ dayOfWeek: day, startTime: start, endTime: end });
const CLASSES = [
  { name: 'Morning Yoga', category: 'Yoga', trainer: 'Meera', capacity: 20, durationMinutes: 60, difficulty: 'beginner', location: 'Group Studio',
    description: 'Start the day with breath-led yoga for flexibility and calm.',
    schedules: [t(1, '06:30', '07:30'), t(3, '06:30', '07:30'), t(5, '06:30', '07:30')] },
  { name: 'HIIT Blast', category: 'HIIT', trainer: 'Arjun', capacity: 15, durationMinutes: 45, difficulty: 'intermediate', location: 'Functional Zone',
    description: 'Short, intense intervals that torch calories and build stamina.',
    schedules: [t(2, '07:00', '07:45'), t(4, '07:00', '07:45'), t(6, '08:00', '08:45')] },
  { name: 'Strength Foundations', category: 'Strength', trainer: 'Rahul', capacity: 12, durationMinutes: 60, difficulty: 'beginner', location: 'Strength Zone',
    description: 'Learn the big lifts with coaching on form and progression.',
    schedules: [t(1, '18:00', '19:00'), t(3, '18:00', '19:00')] },
  { name: 'Zumba Party', category: 'Dance', trainer: 'Meera', capacity: 25, durationMinutes: 60, difficulty: 'all_levels', location: 'Group Studio',
    description: 'Dance-fitness to upbeat music. No experience needed.',
    schedules: [t(5, '19:00', '20:00'), t(7, '10:00', '11:00')] },
  { name: 'Powerlifting Clinic', category: 'Strength', trainer: 'Rahul', capacity: 8, durationMinutes: 90, difficulty: 'advanced', location: 'Strength Zone',
    description: 'Squat, bench and deadlift technique for experienced lifters.',
    schedules: [t(6, '10:00', '11:30')] },
  { name: 'Evening Cardio Burn', category: 'Cardio', trainer: 'Arjun', capacity: 20, durationMinutes: 45, difficulty: 'all_levels', location: 'Cardio Deck',
    description: 'Mixed cardio circuits to wind down the day.',
    schedules: [t(1, '19:30', '20:15'), t(4, '19:30', '20:15')] },
];

async function addAttendance(memberId, date, adminId) {
  const [y, m, d] = date.split('-').map(Number);
  const istMinutes = 6 * 60 + Math.floor(Math.random() * 14 * 60); // 06:00 to 20:00 IST
  const checkIn = new Date(Date.UTC(y, m - 1, d, 0, istMinutes - 330)); // IST to UTC
  const checkOut = new Date(checkIn.getTime() + (45 + Math.floor(Math.random() * 60)) * 60000);
  await db.execute(
    `INSERT INTO attendance (member_id, attendance_date, check_in_at, check_out_at, recorded_by)
     VALUES (?, CAST(? AS date), ?, ?, ?)`,
    [memberId, date, checkIn, checkOut, adminId]
  );
}

async function main() {
  if (config.isProd) throw new Error('Sample data must not be loaded in production.');

  if ((await db.query('SELECT id FROM users WHERE email = ?', [emailOf('Aarav', 'Sharma')])).length) {
    console.log('Sample data already exists. Nothing changed.');
    return;
  }
  const admins = await db.query(
    "SELECT TOP 1 u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'admin' AND u.deleted_at IS NULL"
  );
  if (!admins.length) throw new Error('No admin found. Run "npm run seed:admin" first.');
  const adminId = admins[0].id;

  const req = { user: { id: adminId, role: 'admin' }, ip: '127.0.0.1', get: () => 'seed-script' };
  const password = `${crypto.randomBytes(9).toString('base64url')}Aa1!`; // always meets the password policy
  const today = (await membershipModel.today(db));

  const plans = new Map((await db.query('SELECT id, name, price FROM membership_plans')).map((p) => [p.name, p]));

  // ---------- trainers ----------
  const trainerIds = new Map();
  for (const tr of TRAINERS) {
    const created = await trainerService.create(
      {
        firstName: tr.first, lastName: tr.last, email: emailOf(tr.first, tr.last), password, phone: tr.phone,
        specialization: tr.specialization, bio: tr.bio, certifications: tr.certs,
        experienceYears: tr.years, isFeatured: true, hiredOn: addDays(today, -400),
      },
      req
    );
    trainerIds.set(tr.first, created.id);
  }
  console.log(`Created ${TRAINERS.length} trainers`);

  // ---------- members, memberships, payments, attendance ----------
  const created = [];
  for (const m of MEMBERS) {
    const member = await memberService.create(
      {
        firstName: m.first, lastName: m.last, email: emailOf(m.first, m.last), password, phone: m.phone,
        gender: m.gender, dateOfBirth: m.dob, city: 'Virar', state: 'Maharashtra',
      },
      req
    );
    let membership = null;
    if (m.plan) {
      const plan = plans.get(m.plan);
      const startDate = addDays(today, m.start);
      membership = await membershipService.create(
        {
          memberId: member.id,
          planId: plan.id,
          startDate,
          initialPayment: m.pay
            ? {
                amount: m.pay === 'full' ? plan.price : Math.round(plan.price / 2),
                method: m.method,
                paidAt: `${startDate}T10:00:00.000Z`,
              }
            : undefined,
        },
        req
      );
    }
    created.push({ member, membership, spec: m });
  }
  console.log(`Created ${MEMBERS.length} members with memberships and payments`);

  // ---------- trainer assignments (first 5 members, round robin) ----------
  const names = [...trainerIds.keys()];
  for (let i = 0; i < 5; i += 1) {
    await trainerService.assign(created[i].member.id, trainerIds.get(names[i % names.length]), 'Sample assignment', req);
  }

  // ---------- classes ----------
  for (const c of CLASSES) {
    const { trainer, ...rest } = c;
    await classService.create({ ...rest, trainerId: trainerIds.get(trainer) }, req);
  }
  console.log(`Created ${CLASSES.length} classes`);

  // ---------- attendance history for paying members ----------
  let visits = 0;
  for (const { member, membership, spec } of created) {
    if (!membership || !spec.pay) continue;
    const last = addDays(today, -1);
    const end = membership.expiryDate < last ? membership.expiryDate : last;
    for (let day = membership.startDate, n = 0; day <= end && n < 40; day = addDays(day, 1)) {
      if (Math.random() < 0.55) {
        await addAttendance(member.id, day, adminId);
        visits += 1;
        n += 1;
      }
    }
  }
  console.log(`Created ${visits} attendance records`);

  // ---------- enquiries and contact messages ----------
  const planId = (name) => (plans.get(name) ? plans.get(name).id : null);
  const enquiries = [
    ['Manish Gupta', 'manish@example.com', '9899000001', planId('Yearly'), 'Do you have a student discount on the yearly plan?', 'new'],
    ['Pooja Rane', 'pooja@example.com', '9899000002', planId('Monthly'), 'Is a free trial day available?', 'contacted'],
    ['Sameer Khan', 'sameer@example.com', null, planId('Quarterly'), 'Interested in personal training too.', 'converted'],
    ['Divya Menon', 'divya@example.com', '9899000004', null, 'What are your timings on Sundays?', 'new'],
  ];
  for (const [name, email, phone, plan, message, status] of enquiries) {
    await db.execute(
      'INSERT INTO enquiries (name, email, phone, interested_plan_id, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, plan, message, status]
    );
  }
  const messages = [
    ['Anil Kumar', 'anil@example.com', 'Corporate membership', 'Our company has 30 employees and we would like a group rate. Please contact me.', 0],
    ['Ritu Shah', 'ritu@example.com', 'Lost and found', 'I may have left a water bottle in the Group Studio yesterday evening.', 0],
    ['Tarun Das', 'tarun@example.com', 'Great facility', 'Just wanted to say the new cardio deck is fantastic. Thank you!', 1],
  ];
  for (const [name, email, subject, message, isRead] of messages) {
    await db.execute('INSERT INTO contact_messages (name, email, subject, message, is_read) VALUES (?, ?, ?, ?, ?)', [
      name, email, subject, message, !!isRead,
    ]);
  }

  await membershipJob.run(); // marks old memberships as expired

  console.log('\nDone. Sample accounts (all use the SAME password, shown only now):');
  console.log(`  Password : ${password}`);
  console.log(`  Trainers : ${TRAINERS.map((x) => emailOf(x.first, x.last)).join(', ')}`);
  console.log(`  Members  : ${MEMBERS.map((x) => emailOf(x.first, x.last)).join(', ')}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
'use strict';

const db = require('../config/db');
const { TODAY, dateOut, timeOut, buildUpdate } = require('../utils/sql');
const { likeTerm } = require('../utils/pagination');

const CLASS_SELECT = `
  SELECT c.id, c.name, c.description, c.category, c.trainer_id, c.capacity, c.duration_minutes,
         c.difficulty, c.location, c.image_url, c.is_active, c.created_at,
         u.first_name AS trainer_first, u.last_name AS trainer_last, t.specialization AS trainer_specialization
    FROM classes c
    LEFT JOIN trainers t ON t.id = c.trainer_id
    LEFT JOIN users u ON u.id = t.user_id`;

const toClass = (r) =>
  r && {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    capacity: r.capacity,
    durationMinutes: r.duration_minutes,
    difficulty: r.difficulty,
    location: r.location,
    imageUrl: r.image_url,
    isActive: !!r.is_active,
    trainerId: r.trainer_id,
    trainer: r.trainer_id
      ? { id: r.trainer_id, name: `${r.trainer_first} ${r.trainer_last}`, specialization: r.trainer_specialization }
      : null,
    schedules: [],
    createdAt: r.created_at,
  };

async function attachSchedules(classes, conn = db) {
  if (!classes.length) return classes;
  const ids = classes.map((c) => c.id);
  const rows = await conn.query(
    `SELECT id, class_id, day_of_week, ${timeOut('start_time')} AS start_time, ${timeOut('end_time')} AS end_time
       FROM class_schedules
      WHERE class_id IN (${ids.map(() => '?').join(', ')})
      ORDER BY day_of_week, start_time`,
    ids
  );
  const byClass = new Map(classes.map((c) => [c.id, c]));
  rows.forEach((r) =>
    byClass.get(r.class_id).schedules.push({
      id: r.id,
      dayOfWeek: r.day_of_week,
      startTime: r.start_time,
      endTime: r.end_time,
    })
  );
  return classes;
}

async function listPublic() {
  const rows = await db.query(`${CLASS_SELECT} WHERE c.is_active = 1 ORDER BY c.category, c.name`);
  return attachSchedules(rows.map(toClass));
}

async function listByTrainer(trainerId) {
  const rows = await db.query(`${CLASS_SELECT} WHERE c.trainer_id = ? ORDER BY c.name`, [trainerId]);
  return attachSchedules(rows.map(toClass));
}

async function list({ search, category, active }, { limit, offset }) {
  const where = [];
  const params = [];
  if (search) {
    const t = likeTerm(search);
    where.push('(c.name LIKE ? OR c.category LIKE ?)');
    params.push(t, t);
  }
  if (category) {
    where.push('c.category = ?');
    params.push(category);
  }
  if (active !== undefined) {
    where.push('c.is_active = ?');
    params.push(!!active);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.query(
    `${CLASS_SELECT} ${whereSql} ORDER BY c.name OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(`SELECT COUNT(*) AS total FROM classes c ${whereSql}`, params);
  return { rows: await attachSchedules(rows.map(toClass)), total: count[0].total };
}

async function findById(id, conn = db) {
  const rows = await conn.query(`${CLASS_SELECT} WHERE c.id = ?`, [id]);
  const cls = toClass(rows[0]);
  if (!cls) return null;
  await attachSchedules([cls], conn);
  return cls;
}

async function insert(tx, d) {
  const rows = await tx.query(
    `INSERT INTO classes
       (name, description, category, trainer_id, capacity, duration_minutes, difficulty, location, image_url, is_active)
     OUTPUT INSERTED.id
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.name,
      d.description ?? null,
      d.category ?? null,
      d.trainerId ?? null,
      d.capacity ?? 20,
      d.durationMinutes ?? 60,
      d.difficulty ?? 'all_levels',
      d.location ?? null,
      d.imageUrl ?? null,
      d.isActive === undefined ? true : !!d.isActive,
    ]
  );
  return rows[0].id;
}

const ALLOWED = {
  name: 'name',
  description: 'description',
  category: 'category',
  trainerId: 'trainer_id',
  capacity: 'capacity',
  durationMinutes: 'duration_minutes',
  difficulty: 'difficulty',
  location: 'location',
  imageUrl: 'image_url',
  isActive: 'is_active',
};

async function update(conn, id, data) {
  const { sets, params } = buildUpdate(data, ALLOWED);
  if (!sets.length) return;
  await conn.execute(`UPDATE classes SET ${sets.join(', ')}, updated_at = SYSUTCDATETIME() WHERE id = ?`, [
    ...params,
    id,
  ]);
}

const remove = (id) => db.execute('DELETE FROM classes WHERE id = ?', [id]);

// ---------------- schedules ----------------
async function findSchedule(id, conn = db) {
  const rows = await conn.query(
    `SELECT cs.id, cs.class_id, cs.day_of_week, ${timeOut('cs.start_time')} AS start_time,
            ${timeOut('cs.end_time')} AS end_time, c.trainer_id, c.name AS class_name
       FROM class_schedules cs
       JOIN classes c ON c.id = cs.class_id
      WHERE cs.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function insertSchedule(conn, classId, s) {
  const rows = await conn.query(
    `INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time)
     OUTPUT INSERTED.id
     VALUES (?, ?, CAST(? AS time(0)), CAST(? AS time(0)))`,
    [classId, s.dayOfWeek, s.startTime, s.endTime]
  );
  return rows[0].id;
}

const deleteSchedule = (id) => db.execute('DELETE FROM class_schedules WHERE id = ?', [id]);

/** Another slot of an active class of the same trainer that overlaps this day/time range */
async function findTrainerConflict(conn, { trainerId, dayOfWeek, startTime, endTime }) {
  const rows = await conn.query(
    `SELECT TOP 1 c.name
       FROM class_schedules cs
       JOIN classes c ON c.id = cs.class_id
      WHERE c.trainer_id = ? AND c.is_active = 1 AND cs.day_of_week = ?
        AND cs.start_time < CAST(? AS time(0)) AND cs.end_time > CAST(? AS time(0))`,
    [trainerId, dayOfWeek, endTime, startTime]
  );
  return rows[0] || null;
}

/** Upcoming (today or later) bookings that would be affected by deleting a class / slot */
async function countFutureBookings({ classId, scheduleId }) {
  if (scheduleId) {
    const rows = await db.query(
      `SELECT COUNT(*) AS c FROM class_bookings
        WHERE schedule_id = ? AND status = 'booked' AND booking_date >= ${TODAY}`,
      [scheduleId]
    );
    return rows[0].c;
  }
  const rows = await db.query(
    `SELECT COUNT(*) AS c
       FROM class_bookings b JOIN class_schedules cs ON cs.id = b.schedule_id
      WHERE cs.class_id = ? AND b.status = 'booked' AND b.booking_date >= ${TODAY}`,
    [classId]
  );
  return rows[0].c;
}

/** Who is booked for a class on one date (names only, no contact details) */
async function bookingsForClassOnDate(classId, date) {
  const rows = await db.query(
    `SELECT b.id, b.schedule_id, b.status, ${timeOut('cs.start_time')} AS start_time, ${timeOut('cs.end_time')} AS end_time,
            m.id AS member_id, m.member_code, u.first_name, u.last_name
       FROM class_bookings b
       JOIN class_schedules cs ON cs.id = b.schedule_id
       JOIN members m ON m.id = b.member_id
       JOIN users u ON u.id = m.user_id
      WHERE cs.class_id = ? AND b.booking_date = CAST(? AS date) AND b.status <> 'cancelled'
      ORDER BY cs.start_time, u.first_name`,
    [classId, date]
  );
  return rows.map((r) => ({
    id: r.id,
    scheduleId: r.schedule_id,
    status: r.status,
    startTime: r.start_time,
    endTime: r.end_time,
    memberId: r.member_id,
    memberCode: r.member_code,
    memberName: `${r.first_name} ${r.last_name}`,
  }));
}

/** All slots that run on a weekday, with seats taken and whether this member booked */
async function schedulesForDate(date, dayOfWeek, memberId) {
  const rows = await db.query(
    `SELECT cs.id AS schedule_id, c.id AS class_id, c.name, c.category, c.difficulty, c.location, c.capacity,
            ${timeOut('cs.start_time')} AS start_time, ${timeOut('cs.end_time')} AS end_time,
            u.first_name AS trainer_first, u.last_name AS trainer_last,
            (SELECT COUNT(*) FROM class_bookings b
              WHERE b.schedule_id = cs.id AND b.booking_date = CAST(? AS date)
                AND b.status IN ('booked', 'attended')) AS booked_count,
            (SELECT TOP 1 b.id FROM class_bookings b
              WHERE b.schedule_id = cs.id AND b.booking_date = CAST(? AS date)
                AND b.member_id = ? AND b.status = 'booked') AS my_booking_id
       FROM class_schedules cs
       JOIN classes c ON c.id = cs.class_id
       LEFT JOIN trainers t ON t.id = c.trainer_id
       LEFT JOIN users u ON u.id = t.user_id
      WHERE c.is_active = 1 AND cs.day_of_week = ?
      ORDER BY cs.start_time, c.name`,
    [date, date, memberId, dayOfWeek]
  );
  return rows.map((r) => ({
    scheduleId: r.schedule_id,
    classId: r.class_id,
    name: r.name,
    category: r.category,
    difficulty: r.difficulty,
    location: r.location,
    startTime: r.start_time,
    endTime: r.end_time,
    trainerName: r.trainer_first ? `${r.trainer_first} ${r.trainer_last}` : null,
    capacity: r.capacity,
    booked: r.booked_count,
    spotsLeft: Math.max(r.capacity - r.booked_count, 0),
    isFull: r.booked_count >= r.capacity,
    myBookingId: r.my_booking_id,
  }));
}

module.exports = {
  listPublic,
  listByTrainer,
  list,
  findById,
  insert,
  update,
  remove,
  findSchedule,
  insertSchedule,
  deleteSchedule,
  findTrainerConflict,
  countFutureBookings,
  bookingsForClassOnDate,
  schedulesForDate,
  dateOut,
};
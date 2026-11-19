'use strict';

const db = require('../config/db');
const { TODAY, dateOut, timeOut } = require('../utils/sql');

/** Today's date and current time in the gym's timezone: { d: 'YYYY-MM-DD', t: 'HH:mm' } */
async function nowIst(conn = db) {
  const rows = await conn.query(
    `SELECT ${dateOut(TODAY)} AS d,
            CONVERT(varchar(5), CAST(SYSDATETIMEOFFSET() AT TIME ZONE 'India Standard Time' AS time(0)), 108) AS t`
  );
  return rows[0];
}

/** Locks the slot row so two members booking the last seat are handled one after the other. */
async function lockSchedule(tx, scheduleId) {
  const rows = await tx.query(
    `SELECT cs.id, cs.class_id, cs.day_of_week, ${timeOut('cs.start_time')} AS start_time,
            c.capacity, c.is_active, c.name
       FROM class_schedules cs WITH (UPDLOCK, ROWLOCK)
       JOIN classes c ON c.id = cs.class_id
      WHERE cs.id = ?`,
    [scheduleId]
  );
  return rows[0] || null;
}

async function countTaken(tx, scheduleId, date) {
  const rows = await tx.query(
    `SELECT COUNT(*) AS c FROM class_bookings
      WHERE schedule_id = ? AND booking_date = CAST(? AS date) AND status IN ('booked', 'attended')`,
    [scheduleId, date]
  );
  return rows[0].c;
}

async function findExisting(tx, scheduleId, memberId, date) {
  const rows = await tx.query(
    `SELECT id, status FROM class_bookings
      WHERE schedule_id = ? AND member_id = ? AND booking_date = CAST(? AS date)`,
    [scheduleId, memberId, date]
  );
  return rows[0] || null;
}

async function hasActiveMembership(tx, memberId, date) {
  const rows = await tx.query(
    `SELECT TOP 1 id FROM memberships
      WHERE member_id = ? AND status = 'active'
        AND start_date <= CAST(? AS date) AND expiry_date >= CAST(? AS date)`,
    [memberId, date, date]
  );
  return rows.length > 0;
}

async function insert(tx, { scheduleId, memberId, date }) {
  const rows = await tx.query(
    `INSERT INTO class_bookings (schedule_id, member_id, booking_date)
     OUTPUT INSERTED.id
     VALUES (?, ?, CAST(? AS date))`,
    [scheduleId, memberId, date]
  );
  return rows[0].id;
}

const reactivate = (tx, id) =>
  tx.execute("UPDATE class_bookings SET status = 'booked', updated_at = SYSUTCDATETIME() WHERE id = ?", [id]);

const cancel = (id) =>
  db.execute(
    "UPDATE class_bookings SET status = 'cancelled', updated_at = SYSUTCDATETIME() WHERE id = ? AND status = 'booked'",
    [id]
  );

const BOOKING_SELECT = `
  SELECT b.id, b.schedule_id, ${dateOut('b.booking_date')} AS booking_date, b.status,
         ${timeOut('cs.start_time')} AS start_time, ${timeOut('cs.end_time')} AS end_time,
         c.id AS class_id, c.name AS class_name, c.location,
         u.first_name AS trainer_first, u.last_name AS trainer_last
    FROM class_bookings b
    JOIN class_schedules cs ON cs.id = b.schedule_id
    JOIN classes c ON c.id = cs.class_id
    LEFT JOIN trainers t ON t.id = c.trainer_id
    LEFT JOIN users u ON u.id = t.user_id`;

const toBooking = (r) =>
  r && {
    id: r.id,
    scheduleId: r.schedule_id,
    classId: r.class_id,
    className: r.class_name,
    date: r.booking_date,
    startTime: r.start_time,
    endTime: r.end_time,
    location: r.location,
    trainerName: r.trainer_first ? `${r.trainer_first} ${r.trainer_last}` : null,
    status: r.status,
  };

async function findForMember(id, memberId) {
  const rows = await db.query(`${BOOKING_SELECT} WHERE b.id = ? AND b.member_id = ?`, [id, memberId]);
  return toBooking(rows[0]) || null;
}

async function listForMember(memberId, { status, upcoming }, { limit, offset }) {
  const where = ['b.member_id = ?'];
  const params = [memberId];
  if (status) {
    where.push('b.status = ?');
    params.push(status);
  }
  if (upcoming) {
    where.push(`b.booking_date >= ${TODAY}`, "b.status = 'booked'");
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const order = upcoming
    ? 'ORDER BY b.booking_date ASC, cs.start_time ASC'
    : 'ORDER BY b.booking_date DESC, cs.start_time DESC';
  const rows = await db.query(`${BOOKING_SELECT} ${whereSql} ${order} OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`, [
    ...params,
    offset,
    limit,
  ]);
  const count = await db.query(`SELECT COUNT(*) AS total FROM class_bookings b ${whereSql}`, params);
  return { rows: rows.map(toBooking), total: count[0].total };
}

module.exports = {
  nowIst,
  lockSchedule,
  countTaken,
  findExisting,
  hasActiveMembership,
  insert,
  reactivate,
  cancel,
  findForMember,
  listForMember,
};
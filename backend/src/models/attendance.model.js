'use strict';

const db = require('../config/db');
const { TODAY, dateOut } = require('../utils/sql');
const { likeTerm } = require('../utils/pagination');

const COLUMNS = `
  a.id, a.member_id, ${dateOut('a.attendance_date')} AS attendance_date,
  a.check_in_at, a.check_out_at, a.notes, m.member_code, u.first_name, u.last_name`;

const FROM = `
  FROM attendance a
  JOIN members m ON m.id = a.member_id
  JOIN users u ON u.id = m.user_id`;

function toAttendance(r) {
  if (!r) return null;
  const minutes =
    r.check_in_at && r.check_out_at
      ? Math.round((new Date(r.check_out_at) - new Date(r.check_in_at)) / 60000)
      : null;
  return {
    id: r.id,
    memberId: r.member_id,
    memberCode: r.member_code,
    memberName: `${r.first_name} ${r.last_name}`,
    date: r.attendance_date,
    checkInAt: r.check_in_at,
    checkOutAt: r.check_out_at,
    durationMinutes: minutes,
    notes: r.notes,
  };
}

async function findById(id, conn = db) {
  const rows = await conn.query(`SELECT ${COLUMNS} ${FROM} WHERE a.id = ?`, [id]);
  return toAttendance(rows[0]);
}

async function findToday(memberId, conn = db) {
  const rows = await conn.query(
    `SELECT ${COLUMNS} ${FROM} WHERE a.member_id = ? AND a.attendance_date = ${TODAY}`,
    [memberId]
  );
  return toAttendance(rows[0]);
}

/** All visits on one day (default: today) */
async function list({ date, search, open }, { limit, offset }) {
  const where = [`a.attendance_date = COALESCE(CAST(? AS date), ${TODAY})`];
  const params = [date || null];
  if (search) {
    const t = likeTerm(search);
    where.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR m.member_code LIKE ?)');
    params.push(t, t, t);
  }
  if (open) where.push('a.check_out_at IS NULL');
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const rows = await db.query(
    `SELECT ${COLUMNS} ${FROM} ${whereSql}
      ORDER BY a.check_in_at DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(
    `SELECT COUNT(*) AS total, COUNT(CASE WHEN a.check_out_at IS NULL THEN 1 END) AS still_in
       ${FROM} ${whereSql}`,
    params
  );
  return { rows: rows.map(toAttendance), total: count[0].total, stillIn: count[0].still_in };
}

/** One member's history, newest first */
async function listForMember(memberId, { from, to }, { limit, offset }) {
  const where = ['a.member_id = ?'];
  const params = [memberId];
  if (from) {
    where.push('a.attendance_date >= CAST(? AS date)');
    params.push(from);
  }
  if (to) {
    where.push('a.attendance_date <= CAST(? AS date)');
    params.push(to);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const rows = await db.query(
    `SELECT ${COLUMNS} ${FROM} ${whereSql}
      ORDER BY a.attendance_date DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(`SELECT COUNT(*) AS total ${FROM} ${whereSql}`, params);
  return { rows: rows.map(toAttendance), total: count[0].total };
}

async function summary(memberId) {
  const rows = await db.query(
    `SELECT COUNT(*) AS total,
            COUNT(CASE WHEN attendance_date >= DATEFROMPARTS(YEAR(${TODAY}), MONTH(${TODAY}), 1) THEN 1 END) AS this_month,
            COUNT(CASE WHEN attendance_date >= DATEADD(DAY, -30, ${TODAY}) THEN 1 END) AS last_30_days
       FROM attendance WHERE member_id = ?`,
    [memberId]
  );
  return { totalVisits: rows[0].total, thisMonth: rows[0].this_month, last30Days: rows[0].last_30_days };
}

async function insert(tx, { memberId, notes, recordedBy }) {
  const rows = await tx.query(
    `INSERT INTO attendance (member_id, attendance_date, check_in_at, notes, recorded_by)
     OUTPUT INSERTED.id
     VALUES (?, ${TODAY}, SYSUTCDATETIME(), ?, ?)`,
    [memberId, notes ?? null, recordedBy]
  );
  return rows[0].id;
}

function checkOut(memberId) {
  return db.execute(
    `UPDATE attendance SET check_out_at = SYSUTCDATETIME()
      WHERE member_id = ? AND attendance_date = ${TODAY} AND check_out_at IS NULL`,
    [memberId]
  );
}

module.exports = { findById, findToday, list, listForMember, summary, insert, checkOut };
'use strict';

const db = require('../config/db');
const { TODAY, dateOut } = require('../utils/sql');
const { likeTerm } = require('../utils/pagination');

const COLUMNS = `
  ms.id, ms.membership_code, ms.member_id, ms.plan_id,
  ${dateOut('ms.start_date')} AS start_date, ${dateOut('ms.expiry_date')} AS expiry_date,
  ms.amount_total, ms.status, ms.payment_status, ms.created_at,
  p.name AS plan_name, p.plan_type,
  m.member_code, u.first_name, u.last_name,
  COALESCE((SELECT SUM(pay.amount) FROM payments pay
             WHERE pay.membership_id = ms.id AND pay.status = 'completed'), 0) AS amount_paid`;

const FROM = `
  FROM memberships ms
  JOIN membership_plans p ON p.id = ms.plan_id
  JOIN members m ON m.id = ms.member_id
  JOIN users u ON u.id = m.user_id`;

const toMembership = (r) =>
  r && {
    id: r.id,
    code: r.membership_code,
    memberId: r.member_id,
    memberCode: r.member_code,
    memberName: `${r.first_name} ${r.last_name}`,
    planId: r.plan_id,
    planName: r.plan_name,
    planType: r.plan_type,
    startDate: r.start_date,
    expiryDate: r.expiry_date,
    amountTotal: r.amount_total,
    amountPaid: r.amount_paid,
    balance: Math.round((r.amount_total - r.amount_paid) * 100) / 100,
    status: r.status,
    paymentStatus: r.payment_status,
    createdAt: r.created_at,
  };

async function findById(id, conn = db) {
  const rows = await conn.query(`SELECT ${COLUMNS} ${FROM} WHERE ms.id = ?`, [id]);
  return toMembership(rows[0]) || null;
}

async function listForMember(memberId) {
  const rows = await db.query(
    `SELECT ${COLUMNS} ${FROM} WHERE ms.member_id = ? ORDER BY ms.expiry_date DESC, ms.id DESC`,
    [memberId]
  );
  return rows.map(toMembership);
}

async function list(f, { limit, offset }) {
  const where = [];
  const params = [];
  if (f.status) {
    where.push('ms.status = ?');
    params.push(f.status);
  }
  if (f.paymentStatus) {
    where.push('ms.payment_status = ?');
    params.push(f.paymentStatus);
  }
  if (f.memberId) {
    where.push('ms.member_id = ?');
    params.push(f.memberId);
  }
  if (f.search) {
    const t = likeTerm(f.search);
    where.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR m.member_code LIKE ? OR ms.membership_code LIKE ?)');
    params.push(t, t, t, t);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.query(
    `SELECT ${COLUMNS} ${FROM} ${whereSql}
      ORDER BY ms.id DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(`SELECT COUNT(*) AS total ${FROM} ${whereSql}`, params);
  return { rows: rows.map(toMembership), total: count[0].total };
}

// ---------------- helpers used inside a transaction ----------------
async function today(conn) {
  const rows = await conn.query(`SELECT ${dateOut(TODAY)} AS d`);
  return rows[0].d;
}

async function computeExpiry(conn, startDate, durationDays) {
  const rows = await conn.query(
    `SELECT ${dateOut('DATEADD(DAY, ?, CAST(? AS date))')} AS d`,
    [durationDays, startDate]
  );
  return rows[0].d;
}

/** Finds a pending/active/frozen membership that overlaps the date range. Locks the range. */
async function findOverlap(tx, memberId, startDate, expiryDate) {
  const rows = await tx.query(
    `SELECT id, ${dateOut('expiry_date')} AS expiry_date
       FROM memberships WITH (UPDLOCK, HOLDLOCK)
      WHERE member_id = ? AND status IN ('pending', 'active', 'frozen')
        AND start_date <= CAST(? AS date) AND expiry_date >= CAST(? AS date)`,
    [memberId, expiryDate, startDate]
  );
  return rows[0] || null;
}

async function insert(tx, { memberId, planId, startDate, durationDays, amountTotal, createdBy }) {
  const rows = await tx.query(
    `INSERT INTO memberships
       (member_id, plan_id, start_date, expiry_date, amount_total, status, payment_status, created_by)
     OUTPUT INSERTED.id
     VALUES (?, ?, CAST(? AS date), DATEADD(DAY, ?, CAST(? AS date)), ?, 'pending', 'unpaid', ?)`,
    [memberId, planId, startDate, durationDays, startDate, amountTotal, createdBy]
  );
  const id = rows[0].id;
  await tx.execute('UPDATE memberships SET membership_code = ? WHERE id = ?', [
    `MSP-${String(id).padStart(6, '0')}`,
    id,
  ]);
  return id;
}

module.exports = { findById, listForMember, list, today, computeExpiry, findOverlap, insert };
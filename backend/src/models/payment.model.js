'use strict';

const db = require('../config/db');
const { localDate } = require('../utils/sql');
const { likeTerm } = require('../utils/pagination');

const COLUMNS = `
  pay.id, pay.receipt_no, pay.membership_id, pay.member_id, pay.amount, pay.method, pay.status,
  pay.gateway, pay.transaction_ref, pay.paid_at, pay.notes, pay.created_at,
  ms.membership_code, p.name AS plan_name, m.member_code, u.first_name, u.last_name`;

const FROM = `
  FROM payments pay
  JOIN memberships ms ON ms.id = pay.membership_id
  JOIN membership_plans p ON p.id = ms.plan_id
  JOIN members m ON m.id = pay.member_id
  JOIN users u ON u.id = m.user_id`;

const toPayment = (r) =>
  r && {
    id: r.id,
    receiptNo: r.receipt_no,
    membershipId: r.membership_id,
    membershipCode: r.membership_code,
    memberId: r.member_id,
    memberCode: r.member_code,
    memberName: `${r.first_name} ${r.last_name}`,
    planName: r.plan_name,
    amount: r.amount,
    method: r.method,
    status: r.status,
    gateway: r.gateway,
    transactionRef: r.transaction_ref,
    paidAt: r.paid_at,
    notes: r.notes,
    createdAt: r.created_at,
  };

async function findById(id, conn = db) {
  const rows = await conn.query(`SELECT ${COLUMNS} ${FROM} WHERE pay.id = ?`, [id]);
  return toPayment(rows[0]) || null;
}

async function listForMembership(membershipId) {
  const rows = await db.query(`SELECT ${COLUMNS} ${FROM} WHERE pay.membership_id = ? ORDER BY pay.id DESC`, [
    membershipId,
  ]);
  return rows.map(toPayment);
}

function buildFilter(f) {
  const where = [];
  const params = [];
  if (f.memberId) {
    where.push('pay.member_id = ?');
    params.push(f.memberId);
  }
  if (f.membershipId) {
    where.push('pay.membership_id = ?');
    params.push(f.membershipId);
  }
  if (f.status) {
    where.push('pay.status = ?');
    params.push(f.status);
  }
  if (f.method) {
    where.push('pay.method = ?');
    params.push(f.method);
  }
  if (f.from) {
    where.push(`${localDate('pay.paid_at')} >= CAST(? AS date)`);
    params.push(f.from);
  }
  if (f.to) {
    where.push(`${localDate('pay.paid_at')} <= CAST(? AS date)`);
    params.push(f.to);
  }
  if (f.search) {
    const t = likeTerm(f.search);
    where.push('(pay.receipt_no LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR m.member_code LIKE ?)');
    params.push(t, t, t, t);
  }
  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

async function list(filters, { limit, offset }) {
  const { whereSql, params } = buildFilter(filters);
  const rows = await db.query(
    `SELECT ${COLUMNS} ${FROM} ${whereSql}
      ORDER BY pay.id DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN pay.status = 'completed' THEN pay.amount END), 0) AS completed_total
       ${FROM} ${whereSql}`,
    params
  );
  return { rows: rows.map(toPayment), total: count[0].total, completedTotal: count[0].completed_total };
}

async function insert(tx, p) {
  const rows = await tx.query(
    `INSERT INTO payments
       (membership_id, member_id, amount, method, status, gateway, transaction_ref, paid_at, notes, recorded_by)
     OUTPUT INSERTED.id
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.membershipId,
      p.memberId,
      p.amount,
      p.method,
      p.status,
      p.gateway,
      p.transactionRef,
      p.paidAt,
      p.notes,
      p.recordedBy,
    ]
  );
  return rows[0].id;
}

async function setReceipt(tx, id, receiptNo) {
  await tx.execute('UPDATE payments SET receipt_no = ? WHERE id = ?', [receiptNo, id]);
}

/** Money already collected / refunded for a membership. */
async function totals(conn, membershipId) {
  const rows = await conn.query(
    `SELECT COALESCE(SUM(CASE WHEN status = 'completed' THEN amount END), 0) AS paid,
            COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount END), 0) AS refunded
       FROM payments WHERE membership_id = ?`,
    [membershipId]
  );
  return rows[0];
}

module.exports = { findById, listForMembership, list, insert, setReceipt, totals };
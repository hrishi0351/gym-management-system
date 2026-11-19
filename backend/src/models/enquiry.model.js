'use strict';

const db = require('../config/db');
const { buildUpdate } = require('../utils/sql');
const { likeTerm } = require('../utils/pagination');

const COLUMNS = `
  e.id, e.name, e.email, e.phone, e.interested_plan_id, p.name AS plan_name, e.message, e.status,
  e.admin_notes, e.handled_by, h.first_name AS handler_first, h.last_name AS handler_last,
  e.created_at, e.updated_at`;

const FROM = `
  FROM enquiries e
  LEFT JOIN membership_plans p ON p.id = e.interested_plan_id
  LEFT JOIN users h ON h.id = e.handled_by`;

const toEnquiry = (r) =>
  r && {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    planId: r.interested_plan_id,
    planName: r.plan_name,
    message: r.message,
    status: r.status,
    adminNotes: r.admin_notes,
    handledBy: r.handler_first ? `${r.handler_first} ${r.handler_last}` : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };

async function list({ status, search }, { limit, offset }) {
  const where = [];
  const params = [];
  if (status) {
    where.push('e.status = ?');
    params.push(status);
  }
  if (search) {
    const t = likeTerm(search);
    where.push('(e.name LIKE ? OR e.email LIKE ? OR e.phone LIKE ?)');
    params.push(t, t, t);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.query(
    `SELECT ${COLUMNS} ${FROM} ${whereSql} ORDER BY e.id DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(`SELECT COUNT(*) AS total ${FROM} ${whereSql}`, params);
  return { rows: rows.map(toEnquiry), total: count[0].total };
}

async function findById(id) {
  const rows = await db.query(`SELECT ${COLUMNS} ${FROM} WHERE e.id = ?`, [id]);
  return toEnquiry(rows[0]) || null;
}

async function insert(d) {
  await db.execute(
    `INSERT INTO enquiries (name, email, phone, interested_plan_id, message, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [d.name, d.email, d.phone ?? null, d.planId ?? null, d.message ?? null, d.ip ?? null]
  );
}

/** Same person sending the same message within the last hour = duplicate / spam */
async function findRecentDuplicate(email, message) {
  const rows = await db.query(
    `SELECT TOP 1 id FROM enquiries
      WHERE email = ? AND COALESCE(message, '') = ? AND created_at > DATEADD(HOUR, -1, SYSUTCDATETIME())`,
    [email, message || '']
  );
  return rows[0] || null;
}

async function update(id, data, handledBy) {
  const { sets, params } = buildUpdate(data, { status: 'status', adminNotes: 'admin_notes' });
  sets.push('handled_by = ?');
  params.push(handledBy);
  await db.execute(`UPDATE enquiries SET ${sets.join(', ')}, updated_at = SYSUTCDATETIME() WHERE id = ?`, [
    ...params,
    id,
  ]);
}

const remove = (id) => db.execute('DELETE FROM enquiries WHERE id = ?', [id]);

module.exports = { list, findById, insert, findRecentDuplicate, update, remove };
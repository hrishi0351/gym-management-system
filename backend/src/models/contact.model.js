'use strict';

const db = require('../config/db');
const { likeTerm } = require('../utils/pagination');

const toMessage = (r) =>
  r && {
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject,
    message: r.message,
    isRead: !!r.is_read,
    createdAt: r.created_at,
  };

const COLUMNS = 'id, name, email, subject, message, is_read, created_at';

async function list({ isRead, search }, { limit, offset }) {
  const where = [];
  const params = [];
  if (isRead !== undefined) {
    where.push('is_read = ?');
    params.push(!!isRead);
  }
  if (search) {
    const t = likeTerm(search);
    where.push('(name LIKE ? OR email LIKE ? OR subject LIKE ?)');
    params.push(t, t, t);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.query(
    `SELECT ${COLUMNS} FROM contact_messages ${whereSql}
      ORDER BY id DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(
    `SELECT COUNT(*) AS total, COUNT(CASE WHEN is_read = 0 THEN 1 END) AS unread
       FROM contact_messages ${whereSql}`,
    params
  );
  return { rows: rows.map(toMessage), total: count[0].total, unread: count[0].unread };
}

async function findById(id) {
  const rows = await db.query(`SELECT ${COLUMNS} FROM contact_messages WHERE id = ?`, [id]);
  return toMessage(rows[0]) || null;
}

async function insert(d) {
  await db.execute(
    'INSERT INTO contact_messages (name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?)',
    [d.name, d.email, d.subject, d.message, d.ip ?? null]
  );
}

async function findRecentDuplicate(email, subject, message) {
  const rows = await db.query(
    `SELECT TOP 1 id FROM contact_messages
      WHERE email = ? AND subject = ? AND message = ? AND created_at > DATEADD(HOUR, -1, SYSUTCDATETIME())`,
    [email, subject, message]
  );
  return rows[0] || null;
}

const setRead = (id, isRead) =>
  db.execute('UPDATE contact_messages SET is_read = ? WHERE id = ?', [!!isRead, id]);

const remove = (id) => db.execute('DELETE FROM contact_messages WHERE id = ?', [id]);

module.exports = { list, findById, insert, findRecentDuplicate, setRead, remove };
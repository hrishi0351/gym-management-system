'use strict';

const defaultDb = require('../config/db');

const SELECT_USER = `
  SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.phone, u.status,
         u.failed_login_attempts, u.locked_until, u.deleted_at, u.password_changed_at,
         r.name AS role
    FROM users u
    JOIN roles r ON r.id = u.role_id`;

async function findByEmail(email, db = defaultDb) {
  const rows = await db.query(`${SELECT_USER} WHERE u.email = ?`, [email]);
  return rows[0] || null;
}

async function findById(id, db = defaultDb) {
  const rows = await db.query(`${SELECT_USER} WHERE u.id = ?`, [id]);
  return rows[0] || null;
}

/** Creates users + members rows. Must be called inside a transaction (tx). */
async function createMember(tx, { email, passwordHash, firstName, lastName, phone }) {
  const roles = await tx.query('SELECT id FROM roles WHERE name = ?', ['member']);
  if (!roles.length) throw new Error('Role "member" not found. Run database/sqlserver/seed.sql first.');

  const users = await tx.query(
    `INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, password_changed_at)
     OUTPUT INSERTED.id
     VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME())`,
    [roles[0].id, email, passwordHash, firstName, lastName, phone ?? null]
  );
  const userId = users[0].id;

  const members = await tx.query('INSERT INTO members (user_id) OUTPUT INSERTED.id VALUES (?)', [userId]);
  const memberId = members[0].id;
  const memberCode = `GYM-${String(memberId).padStart(6, '0')}`;
  await tx.execute('UPDATE members SET member_code = ? WHERE id = ?', [memberCode, memberId]);

  return { id: userId, memberId, email, first_name: firstName, last_name: lastName, phone, role: 'member' };
}

/** +1 failed attempt; locks the account when the limit is reached. */
async function recordFailedLogin(userId, maxAttempts, lockoutMinutes) {
  await defaultDb.execute(
    `UPDATE users SET
       failed_login_attempts = CASE WHEN failed_login_attempts + 1 >= ? THEN 0 ELSE failed_login_attempts + 1 END,
       locked_until = CASE WHEN failed_login_attempts + 1 >= ? THEN DATEADD(MINUTE, ?, SYSUTCDATETIME()) ELSE locked_until END
     WHERE id = ?`,
    [maxAttempts, maxAttempts, lockoutMinutes, userId]
  );
}

async function recordSuccessfulLogin(userId) {
  await defaultDb.execute(
    `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = SYSUTCDATETIME()
      WHERE id = ?`,
    [userId]
  );
}

async function updatePassword(db, userId, passwordHash) {
  await db.execute(
    `UPDATE users SET password_hash = ?, password_changed_at = SYSUTCDATETIME(),
            updated_at = SYSUTCDATETIME(), failed_login_attempts = 0, locked_until = NULL
      WHERE id = ?`,
    [passwordHash, userId]
  );
}

/** Role-specific profile ids (member id / trainer id). */
async function getProfileIds(userId, role) {
  if (role === 'member') {
    const rows = await defaultDb.query('SELECT id, member_code FROM members WHERE user_id = ?', [userId]);
    return rows[0] ? { memberId: rows[0].id, memberCode: rows[0].member_code } : {};
  }
  if (role === 'trainer') {
    const rows = await defaultDb.query('SELECT id FROM trainers WHERE user_id = ?', [userId]);
    return rows[0] ? { trainerId: rows[0].id } : {};
  }
  return {};
}

module.exports = {
  findByEmail,
  findById,
  createMember,
  recordFailedLogin,
  recordSuccessfulLogin,
  updatePassword,
  getProfileIds,
};
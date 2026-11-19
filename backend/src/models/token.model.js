'use strict';

const defaultDb = require('../config/db');

// ---------------- Refresh tokens ----------------
async function createRefreshToken(db, { userId, tokenHash, expiresAt, ip, userAgent }) {
  await db.execute(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, tokenHash, expiresAt, ip || null, userAgent || null]
  );
}

async function findRefreshToken(tokenHash) {
  const rows = await defaultDb.query(
    `SELECT id, user_id, expires_at, revoked_at, replaced_by_hash
       FROM refresh_tokens WHERE token_hash = CAST(? AS CHAR(64))`,
    [tokenHash]
  );
  return rows[0] || null;
}

/** Revokes one token only if still active. Returns rows affected (1 = we won, 0 = someone else did). */
async function revokeRefreshToken(db, id, replacedByHash = null) {
  const r = await db.execute(
    `UPDATE refresh_tokens
        SET revoked_at = SYSUTCDATETIME(), replaced_by_hash = CAST(? AS CHAR(64))
      WHERE id = ? AND revoked_at IS NULL`,
    [replacedByHash, id]
  );
  return r.rowsAffected;
}

async function revokeByHash(tokenHash) {
  await defaultDb.execute(
    `UPDATE refresh_tokens SET revoked_at = SYSUTCDATETIME()
      WHERE token_hash = CAST(? AS CHAR(64)) AND revoked_at IS NULL`,
    [tokenHash]
  );
}

async function revokeAllForUser(db, userId) {
  await db.execute(
    'UPDATE refresh_tokens SET revoked_at = SYSUTCDATETIME() WHERE user_id = ? AND revoked_at IS NULL',
    [userId]
  );
}

// ---------------- Password reset tokens ----------------
async function invalidateResetTokens(db, userId) {
  await db.execute(
    'UPDATE password_reset_tokens SET used_at = SYSUTCDATETIME() WHERE user_id = ? AND used_at IS NULL',
    [userId]
  );
}

async function createResetToken(db, { userId, tokenHash, expiresAt }) {
  await db.execute(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );
}

async function findValidResetToken(tokenHash) {
  const rows = await defaultDb.query(
    `SELECT id, user_id FROM password_reset_tokens
      WHERE token_hash = CAST(? AS CHAR(64)) AND used_at IS NULL AND expires_at > SYSUTCDATETIME()`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function markResetTokenUsed(db, id) {
  const r = await db.execute(
    'UPDATE password_reset_tokens SET used_at = SYSUTCDATETIME() WHERE id = ? AND used_at IS NULL',
    [id]
  );
  return r.rowsAffected;
}

module.exports = {
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeByHash,
  revokeAllForUser,
  invalidateResetTokens,
  createResetToken,
  findValidResetToken,
  markResetTokenUsed,
};
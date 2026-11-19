'use strict';

const { withTransaction, query } = require('../config/db');
const AppError = require('../utils/AppError');
const { hashPassword } = require('../utils/password');
const { TODAY } = require('../utils/sql');
const userModel = require('../models/user.model');
const memberModel = require('../models/member.model');
const tokenModel = require('../models/token.model');
const audit = require('./audit.service');

async function create(data, req) {
  const { email, password, firstName, lastName, phone, ...profile } = data;
  const passwordHash = await hashPassword(password);

  const memberId = await withTransaction(async (tx) => {
    if (await userModel.findByEmail(email, tx)) throw AppError.conflict('An account with this email already exists');
    const user = await userModel.createMember(tx, { email, passwordHash, firstName, lastName, phone: phone ?? null });
    await memberModel.update(tx, { memberId: user.memberId, userId: user.id }, profile, true);
    return user.memberId;
  });

  await audit.log({
    userId: req.user.id,
    action: 'MEMBER_CREATED',
    entityType: 'member',
    entityId: memberId,
    details: { email },
    req,
  });
  return memberModel.findById(memberId);
}

/** isAdmin = true lets the caller also change `status`. Members editing themselves pass false. */
async function update(memberId, data, req, isAdmin) {
  const member = await memberModel.findById(memberId);
  if (!member) throw AppError.notFound('Member not found');

  await withTransaction((tx) => memberModel.update(tx, { memberId, userId: member.userId }, data, isAdmin));

  if (isAdmin) {
    await audit.log({
      userId: req.user.id,
      action: 'MEMBER_UPDATED',
      entityType: 'member',
      entityId: memberId,
      details: Object.keys(data),
      req,
    });
  }
  return memberModel.findById(memberId);
}

/**
 * Soft delete: financial history stays. The email is renamed so the same
 * address can register again later.
 */
async function remove(memberId, req) {
  const member = await memberModel.findById(memberId);
  if (!member) throw AppError.notFound('Member not found');

  const active = await query(
    `SELECT COUNT(*) AS c FROM memberships WHERE member_id = ? AND status IN ('pending', 'active', 'frozen')`,
    [memberId]
  );
  if (active[0].c > 0) {
    throw AppError.conflict("Cancel this member's active memberships before deleting the member");
  }

  await withTransaction(async (tx) => {
    await tx.execute(
      `UPDATE users
          SET deleted_at = SYSUTCDATETIME(), status = 'inactive',
              email = LEFT(CONCAT('deleted+', id, '+', email), 255), updated_at = SYSUTCDATETIME()
        WHERE id = ?`,
      [member.userId]
    );
    await tokenModel.revokeAllForUser(tx, member.userId);
    await tx.execute(
      `UPDATE trainer_assignments SET is_active = 0, ended_on = ${TODAY} WHERE member_id = ? AND is_active = 1`,
      [memberId]
    );
  });

  await audit.log({
    userId: req.user.id,
    action: 'MEMBER_DELETED',
    entityType: 'member',
    entityId: memberId,
    details: { memberCode: member.memberCode },
    req,
  });
}

module.exports = { create, update, remove };
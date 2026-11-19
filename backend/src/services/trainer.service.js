'use strict';

const { withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const { hashPassword } = require('../utils/password');
const { TODAY } = require('../utils/sql');
const userModel = require('../models/user.model');
const trainerModel = require('../models/trainer.model');
const tokenModel = require('../models/token.model');
const audit = require('./audit.service');

async function create(data, req) {
  const { email, password, firstName, lastName, phone, ...profile } = data;
  const passwordHash = await hashPassword(password);

  const trainerId = await withTransaction(async (tx) => {
    if (await userModel.findByEmail(email, tx)) throw AppError.conflict('An account with this email already exists');
    return trainerModel.createWithUser(tx, { email, passwordHash, firstName, lastName, phone, ...profile });
  });

  await audit.log({
    userId: req.user.id,
    action: 'TRAINER_CREATED',
    entityType: 'trainer',
    entityId: trainerId,
    details: { email },
    req,
  });
  return trainerModel.findById(trainerId);
}

async function update(trainerId, data, req, isAdmin) {
  const trainer = await trainerModel.findById(trainerId);
  if (!trainer) throw AppError.notFound('Trainer not found');

  await withTransaction((tx) => trainerModel.update(tx, { trainerId, userId: trainer.userId }, data, isAdmin));

  if (isAdmin) {
    await audit.log({
      userId: req.user.id,
      action: 'TRAINER_UPDATED',
      entityType: 'trainer',
      entityId: trainerId,
      details: Object.keys(data),
      req,
    });
  }
  return trainerModel.findById(trainerId);
}

async function remove(trainerId, req) {
  const trainer = await trainerModel.findById(trainerId);
  if (!trainer) throw AppError.notFound('Trainer not found');

  await withTransaction(async (tx) => {
    await tx.execute(
      `UPDATE users
          SET deleted_at = SYSUTCDATETIME(), status = 'inactive',
              email = LEFT(CONCAT('deleted+', id, '+', email), 255), updated_at = SYSUTCDATETIME()
        WHERE id = ?`,
      [trainer.userId]
    );
    await tokenModel.revokeAllForUser(tx, trainer.userId);
    await tx.execute(
      `UPDATE trainer_assignments SET is_active = 0, ended_on = ${TODAY} WHERE trainer_id = ? AND is_active = 1`,
      [trainerId]
    );
    await tx.execute('UPDATE classes SET trainer_id = NULL WHERE trainer_id = ?', [trainerId]);
  });

  await audit.log({
    userId: req.user.id,
    action: 'TRAINER_DELETED',
    entityType: 'trainer',
    entityId: trainerId,
    details: { email: trainer.email },
    req,
  });
}

/** A member has at most one ACTIVE trainer. Assigning a new one ends the previous assignment. */
async function assign(memberId, trainerId, notes, req) {
  await withTransaction(async (tx) => {
    const members = await tx.query(
      'SELECT m.id FROM members m JOIN users u ON u.id = m.user_id WHERE m.id = ? AND u.deleted_at IS NULL',
      [memberId]
    );
    if (!members.length) throw AppError.notFound('Member not found');

    const trainers = await tx.query(
      `SELECT t.id FROM trainers t JOIN users u ON u.id = t.user_id
        WHERE t.id = ? AND u.deleted_at IS NULL AND u.status = 'active'`,
      [trainerId]
    );
    if (!trainers.length) throw AppError.notFound('Trainer not found or not active');

    const current = (
      await tx.query(
        'SELECT id, trainer_id FROM trainer_assignments WITH (UPDLOCK, HOLDLOCK) WHERE member_id = ? AND is_active = 1',
        [memberId]
      )
    )[0];
    if (current && current.trainer_id === trainerId) {
      throw AppError.conflict('This trainer is already assigned to the member');
    }
    if (current) {
      await tx.execute(`UPDATE trainer_assignments SET is_active = 0, ended_on = ${TODAY} WHERE id = ?`, [current.id]);
    }

    // Re-assigning the same pair on the same day re-activates the row (unique constraint)
    const sameDay = (
      await tx.query(
        `SELECT id FROM trainer_assignments WHERE trainer_id = ? AND member_id = ? AND assigned_on = ${TODAY}`,
        [trainerId, memberId]
      )
    )[0];
    if (sameDay) {
      await tx.execute(
        'UPDATE trainer_assignments SET is_active = 1, ended_on = NULL, notes = ?, assigned_by = ? WHERE id = ?',
        [notes || null, req.user.id, sameDay.id]
      );
    } else {
      await tx.execute(
        `INSERT INTO trainer_assignments (trainer_id, member_id, assigned_on, notes, assigned_by)
         VALUES (?, ?, ${TODAY}, ?, ?)`,
        [trainerId, memberId, notes || null, req.user.id]
      );
    }
  });

  await audit.log({
    userId: req.user.id,
    action: 'TRAINER_ASSIGNED',
    entityType: 'member',
    entityId: memberId,
    details: { trainerId },
    req,
  });
}

async function unassign(memberId, req) {
  const { rowsAffected } = await require('../config/db').execute(
    `UPDATE trainer_assignments SET is_active = 0, ended_on = ${TODAY} WHERE member_id = ? AND is_active = 1`,
    [memberId]
  );
  if (!rowsAffected) throw AppError.notFound('This member has no active trainer');
  await audit.log({
    userId: req.user.id,
    action: 'TRAINER_UNASSIGNED',
    entityType: 'member',
    entityId: memberId,
    req,
  });
}

module.exports = { create, update, remove, assign, unassign };
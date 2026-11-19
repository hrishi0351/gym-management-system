'use strict';

const db = require('../config/db');
const AppError = require('../utils/AppError');
const { TODAY } = require('../utils/sql');
const attendanceModel = require('../models/attendance.model');

async function checkIn(memberId, notes, req) {
  const id = await db.withTransaction(async (tx) => {
    const members = await tx.query(
      `SELECT m.id FROM members m JOIN users u ON u.id = m.user_id
        WHERE m.id = ? AND u.deleted_at IS NULL AND u.status = 'active'`,
      [memberId]
    );
    if (!members.length) throw AppError.notFound('Member not found or not active');

    const access = await tx.query(
      `SELECT TOP 1 id FROM memberships
        WHERE member_id = ? AND status = 'active' AND start_date <= ${TODAY} AND expiry_date >= ${TODAY}`,
      [memberId]
    );
    if (!access.length) throw AppError.badRequest('This member has no active membership today');

    const existing = await attendanceModel.findToday(memberId, tx);
    if (existing) {
      throw AppError.conflict(
        existing.checkOutAt ? "This member's visit for today is already completed" : 'This member is already checked in'
      );
    }
    return attendanceModel.insert(tx, { memberId, notes: notes || null, recordedBy: req.user.id });
  });
  return attendanceModel.findById(id);
}

async function checkOut(memberId) {
  const { rowsAffected } = await attendanceModel.checkOut(memberId);
  if (!rowsAffected) throw AppError.notFound('This member has no open check-in today');
  return attendanceModel.findToday(memberId);
}

module.exports = { checkIn, checkOut };
'use strict';

const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const requireMember = asyncHandler(async (req, res, next) => {
  const rows = await db.query('SELECT id FROM members WHERE user_id = ?', [req.user.id]);
  if (!rows.length) throw AppError.forbidden('Member profile not found');
  req.profile = { memberId: rows[0].id };
  next();
});

const requireTrainer = asyncHandler(async (req, res, next) => {
  const rows = await db.query('SELECT id FROM trainers WHERE user_id = ?', [req.user.id]);
  if (!rows.length) throw AppError.forbidden('Trainer profile not found');
  req.profile = { trainerId: rows[0].id };
  next();
});

module.exports = { requireMember, requireTrainer };
'use strict';

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success, created } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const attendanceModel = require('../models/attendance.model');
const memberModel = require('../models/member.model');
const attendanceService = require('../services/attendance.service');

// ---------------- admin ----------------
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 20 });
  const { date, search, open } = req.query;
  const { rows, total, stillIn } = await attendanceModel.list({ date, search, open }, { limit, offset });
  return success(res, rows, 'Attendance loaded', 200, buildMeta(page, limit, total, { currentlyIn: stillIn }));
});

exports.checkIn = asyncHandler(async (req, res) =>
  created(res, await attendanceService.checkIn(req.body.memberId, req.body.notes, req), 'Checked in')
);

exports.checkOut = asyncHandler(async (req, res) =>
  success(res, await attendanceService.checkOut(req.body.memberId), 'Checked out')
);

exports.memberHistory = asyncHandler(async (req, res) => {
  const memberId = Number(req.params.id);
  if (!(await memberModel.findById(memberId))) throw AppError.notFound('Member not found');
  const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 20 });
  const { rows, total } = await attendanceModel.listForMember(
    memberId,
    { from: req.query.from, to: req.query.to },
    { limit, offset }
  );
  return success(res, rows, 'Attendance loaded', 200, buildMeta(page, limit, total, await attendanceModel.summary(memberId)));
});

// ---------------- member (own history) ----------------
exports.myHistory = asyncHandler(async (req, res) => {
  const memberId = req.profile.memberId;
  const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 20 });
  const { rows, total } = await attendanceModel.listForMember(
    memberId,
    { from: req.query.from, to: req.query.to },
    { limit, offset }
  );
  return success(res, rows, 'Attendance loaded', 200, buildMeta(page, limit, total, await attendanceModel.summary(memberId)));
});
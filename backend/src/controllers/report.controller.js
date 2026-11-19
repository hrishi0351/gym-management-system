'use strict';

const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const { addDays, diffDays, isRealDate } = require('../utils/dates');
const membershipModel = require('../models/membership.model');
const reportModel = require('../models/report.model');

/** from/to default to the last `defaultDays` days (in the gym's timezone) */
async function resolveRange(query, defaultDays) {
  const today = await membershipModel.today(db);
  const to = query.to || today;
  const from = query.from || addDays(to, -(defaultDays - 1));
  if (!isRealDate(from) || !isRealDate(to)) throw AppError.badRequest('Invalid date range');
  if (from > to) throw AppError.badRequest('"from" must be on or before "to"');
  if (diffDays(to, from) > 731) throw AppError.badRequest('Date range cannot exceed 2 years');
  return { from, to };
}

exports.revenue = asyncHandler(async (req, res) => {
  const groupBy = req.query.groupBy === 'month' ? 'month' : 'day';
  const { from, to } = await resolveRange(req.query, groupBy === 'month' ? 365 : 30);
  const data = await reportModel.revenue(from, to, groupBy);
  return success(res, { from, to, groupBy, ...data }, 'Revenue report loaded');
});

exports.memberships = asyncHandler(async (req, res) =>
  success(res, await reportModel.membershipsOverview(), 'Membership report loaded')
);

exports.attendance = asyncHandler(async (req, res) => {
  const { from, to } = await resolveRange(req.query, 30);
  return success(res, { from, to, ...(await reportModel.attendanceReport(from, to)) }, 'Attendance report loaded');
});

exports.members = asyncHandler(async (req, res) => {
  const { from, to } = await resolveRange(req.query, 365);
  return success(res, { from, to, ...(await reportModel.membersReport(from, to)) }, 'Members report loaded');
});
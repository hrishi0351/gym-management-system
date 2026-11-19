'use strict';

const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const { addDays, monthKeys } = require('../utils/dates');
const { buildUpdate } = require('../utils/sql');
const pick = require('../utils/pick');
const userModel = require('../models/user.model');
const membershipModel = require('../models/membership.model');
const paymentModel = require('../models/payment.model');
const memberModel = require('../models/member.model');
const reportModel = require('../models/report.model');
const audit = require('../services/audit.service');

/** One value per month for the last N months; months with no data show 0 */
const fillMonths = (keys, rows, field) =>
  keys.map((period) => {
    const row = rows.find((r) => r.period === period);
    return { period, [field]: row ? row[field === 'revenue' ? 'total' : field] : 0 };
  });

exports.dashboard = asyncHandler(async (req, res) => {
  const today = await membershipModel.today(db);
  const keys = monthKeys(today, 6);
  const from = `${keys[0]}-01`;
  const to = addDays(today, 31); // covers the whole current month

  const [stats, revenue, newMembers, statusCounts, expiring, payments, members] = await Promise.all([
    reportModel.dashboardCounts(),
    reportModel.revenue(from, to, 'month'),
    reportModel.newMembersByMonth(from, to),
    reportModel.membershipStatusCounts(),
    reportModel.expiringSoon(7, 5),
    paymentModel.list({}, { limit: 5, offset: 0 }),
    memberModel.list({}, { limit: 5, offset: 0 }),
  ]);

  return success(
    res,
    {
      stats,
      charts: {
        revenueByMonth: fillMonths(keys, revenue.series, 'revenue'),
        newMembersByMonth: fillMonths(keys, newMembers, 'members'),
        membershipStatus: statusCounts,
      },
      expiringSoon: expiring,
      recentPayments: payments.rows,
      recentMembers: members.rows,
    },
    'Dashboard loaded'
  );
});

// ---------------- admin profile (password change uses POST /auth/change-password) ----------------
const publicProfile = (u) => ({
  id: u.id,
  email: u.email,
  firstName: u.first_name,
  lastName: u.last_name,
  phone: u.phone,
  role: u.role,
});

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) throw AppError.unauthorized();
  return success(res, publicProfile(user), 'Profile loaded');
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['firstName', 'lastName', 'phone']); // email and role cannot be changed here
  const { sets, params } = buildUpdate(data, { firstName: 'first_name', lastName: 'last_name', phone: 'phone' });
  if (sets.length) {
    await db.execute(`UPDATE users SET ${sets.join(', ')}, updated_at = SYSUTCDATETIME() WHERE id = ?`, [
      ...params,
      req.user.id,
    ]);
    await audit.log({
      userId: req.user.id,
      action: 'ADMIN_PROFILE_UPDATED',
      entityType: 'user',
      entityId: req.user.id,
      details: Object.keys(data),
      req,
    });
  }
  return success(res, publicProfile(await userModel.findById(req.user.id)), 'Profile updated');
});

// ---------------- audit trail ----------------
exports.activityLogs = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 20 });
  const { action, userId, from, to } = req.query;
  const { rows, total } = await reportModel.activityLogs({ action, userId, from, to }, { limit, offset });
  return success(res, rows, 'Activity logs loaded', 200, buildMeta(page, limit, total));
});
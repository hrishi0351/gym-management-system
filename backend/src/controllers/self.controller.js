'use strict';

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const pick = require('../utils/pick');
const memberModel = require('../models/member.model');
const membershipModel = require('../models/membership.model');
const paymentModel = require('../models/payment.model');
const trainerModel = require('../models/trainer.model');
const memberService = require('../services/member.service');
const trainerService = require('../services/trainer.service');
const { PROFILE } = require('./member.controller');

// ======================= MEMBER (own data only) =======================
const member = {
  getProfile: asyncHandler(async (req, res) => {
    const profile = await memberModel.findById(req.profile.memberId);
    const trainer = await trainerModel.activeTrainerForMember(req.profile.memberId);
    return success(res, { ...profile, trainer }, 'Profile loaded');
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const data = pick(req.body, ['firstName', 'lastName', 'phone', ...PROFILE]); // no status, no email
    const updated = await memberService.update(req.profile.memberId, data, req, false);
    return success(res, updated, 'Profile updated');
  }),

  memberships: asyncHandler(async (req, res) => {
    const all = await membershipModel.listForMember(req.profile.memberId);
    const current = all.find((m) => m.status === 'active') || all.find((m) => m.status === 'pending') || null;
    return success(res, { current, history: all }, 'Memberships loaded');
  }),

  payments: asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { rows, total } = await paymentModel.list({ memberId: req.profile.memberId }, { limit, offset });
    return success(res, rows, 'Payments loaded', 200, buildMeta(page, limit, total));
  }),

  trainer: asyncHandler(async (req, res) =>
    success(res, await trainerModel.activeTrainerForMember(req.profile.memberId), 'Trainer loaded')
  ),
};

// ======================= TRAINER =======================
const trainer = {
  getProfile: asyncHandler(async (req, res) =>
    success(res, await trainerModel.findById(req.profile.trainerId), 'Profile loaded')
  ),

  updateProfile: asyncHandler(async (req, res) => {
    const data = pick(req.body, ['firstName', 'lastName', 'phone', 'specialization', 'bio', 'certifications']);
    return success(res, await trainerService.update(req.profile.trainerId, data, req, false), 'Profile updated');
  }),

  members: asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { rows, total } = await trainerModel.listAssignedMembers(
      req.profile.trainerId,
      { search: req.query.search },
      { limit, offset }
    );
    return success(res, rows, 'Assigned members loaded', 200, buildMeta(page, limit, total));
  }),

  // A trainer may only see members assigned to THEM, and only these fields (no email, address, payments)
  memberDetail: asyncHandler(async (req, res) => {
    const memberId = Number(req.params.memberId);
    if (!(await trainerModel.isAssigned(req.profile.trainerId, memberId))) {
      throw AppError.notFound('Member not found');
    }
    const m = await memberModel.findById(memberId);
    const memberships = await membershipModel.listForMember(memberId);
    const current = memberships.find((x) => x.status !== 'cancelled');
    return success(
      res,
      {
        id: m.id,
        memberCode: m.memberCode,
        firstName: m.firstName,
        lastName: m.lastName,
        phone: m.phone,
        gender: m.gender,
        dateOfBirth: m.dateOfBirth,
        heightCm: m.heightCm,
        weightKg: m.weightKg,
        healthNotes: m.healthNotes,
        emergencyContactName: m.emergencyContactName,
        emergencyContactPhone: m.emergencyContactPhone,
        joinedOn: m.joinedOn,
        membership: current
          ? { planName: current.planName, status: current.status, startDate: current.startDate, expiryDate: current.expiryDate }
          : null,
      },
      'Member loaded'
    );
  }),
};

module.exports = { member, trainer };
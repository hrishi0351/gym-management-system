'use strict';

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success, created } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const pick = require('../utils/pick');
const memberModel = require('../models/member.model');
const membershipModel = require('../models/membership.model');
const trainerModel = require('../models/trainer.model');
const memberService = require('../services/member.service');

const PROFILE = [
  'dateOfBirth', 'gender', 'address', 'city', 'state', 'postalCode',
  'emergencyContactName', 'emergencyContactPhone', 'heightCm', 'weightKg', 'healthNotes',
];
const CREATE_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'password', ...PROFILE];
const UPDATE_FIELDS = ['firstName', 'lastName', 'phone', 'status', ...PROFILE];

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, status, membership } = req.query;
  const { rows, total } = await memberModel.list({ search, status, membership }, { limit, offset });
  return success(res, rows, 'Members loaded', 200, buildMeta(page, limit, total));
});

exports.getOne = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const member = await memberModel.findById(id);
  if (!member) throw AppError.notFound('Member not found');
  const [trainer, memberships] = await Promise.all([
    trainerModel.activeTrainerForMember(id),
    membershipModel.listForMember(id),
  ]);
  return success(res, { ...member, trainer, memberships }, 'Member loaded');
});

exports.create = asyncHandler(async (req, res) =>
  created(res, await memberService.create(pick(req.body, CREATE_FIELDS), req), 'Member created')
);

exports.update = asyncHandler(async (req, res) =>
  success(
    res,
    await memberService.update(Number(req.params.id), pick(req.body, UPDATE_FIELDS), req, true),
    'Member updated'
  )
);

exports.remove = asyncHandler(async (req, res) => {
  await memberService.remove(Number(req.params.id), req);
  return success(res, null, 'Member deleted');
});

exports.PROFILE = PROFILE;
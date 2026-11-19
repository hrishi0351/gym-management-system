'use strict';

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success, created } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const pick = require('../utils/pick');
const trainerModel = require('../models/trainer.model');
const trainerService = require('../services/trainer.service');

const CREATE_FIELDS = [
  'firstName', 'lastName', 'email', 'phone', 'password',
  'specialization', 'bio', 'certifications', 'experienceYears', 'isFeatured', 'hiredOn',
];
const UPDATE_FIELDS = [
  'firstName', 'lastName', 'phone', 'status',
  'specialization', 'bio', 'certifications', 'experienceYears', 'isFeatured', 'hiredOn',
];

exports.listPublic = asyncHandler(async (req, res) =>
  success(res, await trainerModel.listPublic(), 'Trainers loaded')
);

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await trainerModel.list({ search: req.query.search }, { limit, offset });
  return success(res, rows, 'Trainers loaded', 200, buildMeta(page, limit, total));
});

exports.getOne = asyncHandler(async (req, res) => {
  const trainer = await trainerModel.findById(Number(req.params.id));
  if (!trainer) throw AppError.notFound('Trainer not found');
  return success(res, trainer, 'Trainer loaded');
});

exports.create = asyncHandler(async (req, res) =>
  created(res, await trainerService.create(pick(req.body, CREATE_FIELDS), req), 'Trainer created')
);

exports.update = asyncHandler(async (req, res) =>
  success(
    res,
    await trainerService.update(Number(req.params.id), pick(req.body, UPDATE_FIELDS), req, true),
    'Trainer updated'
  )
);

exports.remove = asyncHandler(async (req, res) => {
  await trainerService.remove(Number(req.params.id), req);
  return success(res, null, 'Trainer deleted');
});

exports.assignToMember = asyncHandler(async (req, res) => {
  await trainerService.assign(Number(req.params.id), req.body.trainerId, req.body.notes, req);
  return success(res, null, 'Trainer assigned');
});

exports.unassignMember = asyncHandler(async (req, res) => {
  await trainerService.unassign(Number(req.params.id), req);
  return success(res, null, 'Trainer unassigned');
});
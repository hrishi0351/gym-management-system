'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const pick = require('../utils/pick');
const planService = require('../services/plan.service');

const FIELDS = ['name', 'planType', 'durationDays', 'price', 'description', 'features', 'isPopular', 'isActive'];

exports.listPublic = asyncHandler(async (req, res) =>
  success(res, await planService.listActive(), 'Plans loaded')
);

exports.listAll = asyncHandler(async (req, res) => success(res, await planService.listAll(), 'Plans loaded'));

exports.getOne = asyncHandler(async (req, res) =>
  success(res, await planService.getById(Number(req.params.id)), 'Plan loaded')
);

exports.create = asyncHandler(async (req, res) =>
  created(res, await planService.create(pick(req.body, FIELDS), req), 'Plan created')
);

exports.update = asyncHandler(async (req, res) =>
  success(res, await planService.update(Number(req.params.id), pick(req.body, FIELDS), req), 'Plan updated')
);

exports.remove = asyncHandler(async (req, res) => {
  await planService.remove(Number(req.params.id), req);
  return success(res, null, 'Plan deleted');
});
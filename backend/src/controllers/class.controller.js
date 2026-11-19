'use strict';

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success, created } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const pick = require('../utils/pick');
const classModel = require('../models/class.model');
const classService = require('../services/class.service');

const CLASS_FIELDS = [
  'name', 'description', 'category', 'trainerId', 'capacity',
  'durationMinutes', 'difficulty', 'location', 'imageUrl', 'isActive',
];
const SCHEDULE_FIELDS = ['dayOfWeek', 'startTime', 'endTime'];

exports.CLASS_FIELDS = CLASS_FIELDS;
exports.SCHEDULE_FIELDS = SCHEDULE_FIELDS;

exports.listPublic = asyncHandler(async (req, res) =>
  success(res, await classModel.listPublic(), 'Classes loaded')
);

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, category, active } = req.query;
  const { rows, total } = await classModel.list({ search, category, active }, { limit, offset });
  return success(res, rows, 'Classes loaded', 200, buildMeta(page, limit, total));
});

exports.getOne = asyncHandler(async (req, res) => {
  const cls = await classModel.findById(Number(req.params.id));
  if (!cls) throw AppError.notFound('Class not found');
  return success(res, cls, 'Class loaded');
});

exports.create = asyncHandler(async (req, res) => {
  const data = pick(req.body, CLASS_FIELDS);
  data.schedules = Array.isArray(req.body.schedules) ? req.body.schedules.map((s) => pick(s, SCHEDULE_FIELDS)) : [];
  return created(res, await classService.create(data, req), 'Class created');
});

exports.update = asyncHandler(async (req, res) =>
  success(res, await classService.update(Number(req.params.id), pick(req.body, CLASS_FIELDS), req), 'Class updated')
);

exports.remove = asyncHandler(async (req, res) => {
  await classService.remove(Number(req.params.id), req);
  return success(res, null, 'Class deleted');
});

exports.addSchedule = asyncHandler(async (req, res) =>
  created(res, await classService.addSchedule(Number(req.params.id), pick(req.body, SCHEDULE_FIELDS), req), 'Schedule added')
);

exports.removeSchedule = asyncHandler(async (req, res) =>
  success(res, await classService.removeSchedule(Number(req.params.id), req), 'Schedule removed')
);

exports.bookings = asyncHandler(async (req, res) =>
  success(res, await classService.getBookings(Number(req.params.id), req.query.date), 'Bookings loaded')
);
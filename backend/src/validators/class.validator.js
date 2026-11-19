'use strict';

const { body, query } = require('express-validator');
const { paging } = require('./common.validator');
const { dateQuery, dateBody } = require('./helpers');

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DIFFICULTY = ['beginner', 'intermediate', 'advanced', 'all_levels'];

const scheduleRules = (prefix = '') => [
  body(`${prefix}dayOfWeek`)
    .exists({ checkNull: true }).withMessage('Day of week is required').bail()
    .isInt({ min: 1, max: 7 }).withMessage('Day of week must be 1 (Monday) to 7 (Sunday)')
    .toInt(),
  body(`${prefix}startTime`)
    .exists({ checkNull: true }).withMessage('Start time is required').bail()
    .matches(TIME_RE).withMessage('Start time must be HH:mm (24-hour)'),
  body(`${prefix}endTime`)
    .exists({ checkNull: true }).withMessage('End time is required').bail()
    .matches(TIME_RE).withMessage('End time must be HH:mm (24-hour)'),
];

function classRules(isUpdate) {
  const required = (name, label) =>
    (isUpdate ? body(name).optional() : body(name)).exists({ checkNull: true }).withMessage(`${label} is required`).bail();

  return [
    required('name', 'Name').isString().bail().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2-120 characters'),
    body('description').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 2000 })
      .withMessage('Description must be at most 2000 characters'),
    body('category').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 60 })
      .withMessage('Category must be at most 60 characters'),
    body('trainerId').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Invalid trainer').toInt(),
    body('capacity').optional().isInt({ min: 1, max: 500 }).withMessage('Capacity must be 1-500').toInt(),
    body('durationMinutes').optional().isInt({ min: 5, max: 480 }).withMessage('Duration must be 5-480 minutes').toInt(),
    body('difficulty').optional().isIn(DIFFICULTY).withMessage(`Difficulty must be one of: ${DIFFICULTY.join(', ')}`),
    body('location').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 100 })
      .withMessage('Location must be at most 100 characters'),
    body('imageUrl').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 255 }).bail()
      .custom((v) => v.startsWith('/') || /^https?:\/\//i.test(v))
      .withMessage('Image must be a path starting with / or an http(s) link'),
    body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
    body('schedules').optional().isArray({ max: 21 }).withMessage('Schedules must be a list of up to 21 slots'),
    ...scheduleRules('schedules.*.'),
  ];
}

const trainerUpdate = [
  body('description').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
  body('location').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 100 })
    .withMessage('Location must be at most 100 characters'),
];

const list = [
  ...paging,
  query('category').optional().isString().bail().isLength({ max: 60 }),
  query('active').optional().isBoolean().withMessage('active must be true or false').toBoolean(),
];

const bookingsQuery = [dateQuery('date')];

const availability = [dateQuery('date', { required: true })];

const book = [
  body('scheduleId').exists({ checkNull: true }).withMessage('Class slot is required').bail()
    .isInt({ min: 1 }).withMessage('Invalid class slot').toInt(),
  dateBody('date', { required: true }),
];

const myBookings = [
  ...paging,
  query('status').optional().isIn(['booked', 'cancelled', 'attended', 'no_show']).withMessage('Invalid status'),
  query('upcoming').optional().isBoolean().withMessage('upcoming must be true or false').toBoolean(),
];

module.exports = {
  create: classRules(false),
  update: classRules(true),
  trainerUpdate,
  schedule: scheduleRules(''),
  list,
  bookingsQuery,
  availability,
  book,
  myBookings,
};
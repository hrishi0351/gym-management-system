'use strict';

const { body } = require('express-validator');
const s = require('./shared');
const { paging } = require('./common.validator');

const profile = [
  s.textRule('specialization', 'Specialization', 120),
  s.textRule('bio', 'Bio', 2000),
  s.textRule('certifications', 'Certifications', 255),
];

const adminOnly = [
  body('experienceYears').optional({ values: 'falsy' }).isInt({ min: 0, max: 80 })
    .withMessage('Experience must be 0-80 years').toInt(),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be true or false').toBoolean(),
  s.dateRule('hiredOn', 'Hired date'),
];

const create = [
  s.nameRule('firstName', 'First name', false),
  s.nameRule('lastName', 'Last name', false),
  s.emailRule(),
  s.phoneRule(),
  s.passwordRule('password', 'Password'),
  ...profile,
  ...adminOnly,
];

const update = [
  s.nameRule('firstName', 'First name', true),
  s.nameRule('lastName', 'Last name', true),
  s.phoneRule(),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive or suspended'),
  ...profile,
  ...adminOnly,
];

const selfUpdate = [
  s.nameRule('firstName', 'First name', true),
  s.nameRule('lastName', 'Last name', true),
  s.phoneRule(),
  ...profile,
];

const assign = [
  body('trainerId').exists({ checkNull: true }).withMessage('Trainer is required').bail()
    .isInt({ min: 1 }).withMessage('Invalid trainer').toInt(),
  s.textRule('notes', 'Notes', 255),
];

module.exports = { create, update, selfUpdate, assign, list: paging };
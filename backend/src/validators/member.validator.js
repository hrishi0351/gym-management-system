'use strict';

const { body, query } = require('express-validator');
const s = require('./shared');
const { paging } = require('./common.validator');

const profileRules = () => [
  s.dateRule('dateOfBirth', 'Date of birth', { notFuture: true }),
  body('gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female or other'),
  s.textRule('address', 'Address', 255),
  s.textRule('city', 'City', 80),
  s.textRule('state', 'State', 80),
  s.textRule('postalCode', 'Postal code', 12),
  s.textRule('emergencyContactName', 'Emergency contact name', 120),
  s.phoneRule('emergencyContactPhone'),
  body('heightCm').optional({ values: 'falsy' }).isFloat({ min: 50, max: 300 })
    .withMessage('Height must be between 50 and 300 cm').toFloat(),
  body('weightKg').optional({ values: 'falsy' }).isFloat({ min: 20, max: 500 })
    .withMessage('Weight must be between 20 and 500 kg').toFloat(),
  s.textRule('healthNotes', 'Health notes', 2000),
];

const create = [
  s.nameRule('firstName', 'First name', false),
  s.nameRule('lastName', 'Last name', false),
  s.emailRule(),
  s.phoneRule(),
  s.passwordRule('password', 'Password'),
  ...profileRules(),
];

const update = [
  s.nameRule('firstName', 'First name', true),
  s.nameRule('lastName', 'Last name', true),
  s.phoneRule(),
  body('status').optional().isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status must be active, inactive or suspended'),
  ...profileRules(),
];

// Members editing their own profile: no status field
const selfUpdate = [
  s.nameRule('firstName', 'First name', true),
  s.nameRule('lastName', 'Last name', true),
  s.phoneRule(),
  ...profileRules(),
];

const list = [
  ...paging,
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  query('membership').optional().isIn(['active', 'pending', 'expired', 'frozen', 'none'])
    .withMessage('Invalid membership filter'),
];

module.exports = { create, update, selfUpdate, list };
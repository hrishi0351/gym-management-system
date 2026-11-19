'use strict';

const { query } = require('express-validator');
const s = require('./shared');
const { paging } = require('./common.validator');
const { dateQuery } = require('./helpers');

const profile = [
  s.nameRule('firstName', 'First name', true),
  s.nameRule('lastName', 'Last name', true),
  s.phoneRule(),
];

const activityLogs = [
  ...paging,
  query('action').optional().isString().bail().isLength({ max: 100 }),
  query('userId').optional().isInt({ min: 1 }).withMessage('Invalid user').toInt(),
  dateQuery('from'),
  dateQuery('to'),
];

module.exports = { profile, activityLogs };
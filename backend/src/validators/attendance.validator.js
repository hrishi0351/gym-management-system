'use strict';

const { body, query } = require('express-validator');
const s = require('./shared');
const { paging } = require('./common.validator');
const { dateQuery } = require('./helpers');

const checkInOut = [
  body('memberId').exists({ checkNull: true }).withMessage('Member is required').bail()
    .isInt({ min: 1 }).withMessage('Invalid member').toInt(),
  s.textRule('notes', 'Notes', 255),
];

const list = [
  ...paging,
  dateQuery('date'),
  query('open').optional().isBoolean().withMessage('open must be true or false').toBoolean(),
];

const history = [...paging, dateQuery('from'), dateQuery('to')];

module.exports = { checkInOut, list, history };
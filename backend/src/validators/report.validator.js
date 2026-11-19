'use strict';

const { query } = require('express-validator');
const { dateQuery } = require('./helpers');

const range = [dateQuery('from'), dateQuery('to')];

const revenue = [...range, query('groupBy').optional().isIn(['day', 'month']).withMessage('groupBy must be day or month')];

module.exports = { range, revenue };
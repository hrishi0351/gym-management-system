'use strict';

const { param, query } = require('express-validator');

const idParam = (name = 'id') => param(name).isInt({ min: 1 }).withMessage('Invalid id').toInt();

const paging = [
  query('page').optional().isInt({ min: 1, max: 100000 }).withMessage('page must be a positive number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Invalid search').bail().isLength({ max: 100 }),
];

module.exports = { idParam, paging };
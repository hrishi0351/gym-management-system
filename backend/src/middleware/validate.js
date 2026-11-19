'use strict';

const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

module.exports = function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result
    .array({ onlyFirstError: true })
    .map((e) => ({ field: e.path || e.param, message: e.msg }));
  return next(AppError.badRequest('Validation failed', errors));
};
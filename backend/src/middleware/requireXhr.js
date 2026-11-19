'use strict';

const config = require('../config/env');
const AppError = require('../utils/AppError');

module.exports = function requireXhr(req, res, next) {
  const origin = req.get('origin');
  if (origin && origin !== config.clientUrl) return next(AppError.forbidden('Request origin not allowed'));
  if (req.get('X-Requested-With') !== 'XMLHttpRequest') {
    return next(AppError.forbidden('Missing required request header'));
  }
  return next();
};
'use strict';

const AppError = require('../utils/AppError');

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!allowedRoles.includes(req.user.role)) return next(AppError.forbidden());
  return next();
};

module.exports = { authorize };
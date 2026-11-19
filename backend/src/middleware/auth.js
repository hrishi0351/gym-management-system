'use strict';

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/token');
const userModel = require('../models/user.model');

const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw AppError.unauthorized();

  // Throws JsonWebTokenError / TokenExpiredError -> error handler turns these into 401
  const payload = verifyAccessToken(token);

  const user = await userModel.findById(Number(payload.sub));
  if (!user || user.deleted_at || user.status !== 'active') {
    throw AppError.unauthorized('Account is not active');
  }

  // Tokens issued before the last password change are no longer valid
  if (user.password_changed_at) {
    const changedAtSec = Math.floor(new Date(user.password_changed_at).getTime() / 1000);
    if (payload.iat < changedAtSec) throw AppError.unauthorized('Session expired, please log in again');
  }

  // Role comes from the database, not the token, so role changes apply immediately
  req.user = { id: user.id, role: user.role, email: user.email };
  next();
});

module.exports = { authenticate };
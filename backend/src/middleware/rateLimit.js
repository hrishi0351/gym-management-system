'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const AppError = require('../utils/AppError');

const base = {
  windowMs: config.rateLimit.windowMinutes * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // CORS preflight shouldn't count
  handler: (req, res, next) => next(AppError.tooMany()),
};

// General limiter for the whole API
const apiLimiter = rateLimit({ ...base, limit: config.rateLimit.max });

// Strict limiter for register / forgot / reset
const authLimiter = rateLimit({ ...base, limit: config.rateLimit.authMax });

// Login: only failed attempts count
const loginLimiter = rateLimit({ ...base, limit: config.rateLimit.authMax, skipSuccessfulRequests: true });

// Public forms (enquiry / contact): few submissions per hour per IP
const formLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: parseInt(process.env.FORM_RATE_LIMIT_MAX, 10) || 5,
});

module.exports = { apiLimiter, authLimiter, loginLimiter, formLimiter };
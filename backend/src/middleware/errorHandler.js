'use strict';

const AppError = require('../utils/AppError');
const config = require('../config/env');
const logger = require('../utils/logger');

// 404 for any route that doesn't exist
function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// Translate known low-level errors into AppError-like values
function normalize(err) {
  // Body parser problems
  if (err.type === 'entity.too.large') return { status: 413, message: 'Request body is too large' };
  if (err.type === 'entity.parse.failed') return { status: 400, message: 'Invalid JSON in request body' };

  // JWT problems
  if (err.name === 'TokenExpiredError') return { status: 401, message: 'Session expired, please log in again' };
  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return { status: 401, message: 'Invalid authentication token' };
  }

  // SQL Server problems (error numbers from the mssql package)
  const num = err.number || (err.originalError && err.originalError.info && err.originalError.info.number);
  const msg = String(err.message || '');
  switch (num) {
    case 2627: // unique constraint
    case 2601: // unique index
      return { status: 409, message: 'A record with the same value already exists' };
    case 547: // FK or CHECK violation
      if (/DELETE statement/i.test(msg)) return { status: 409, message: 'This record is in use and cannot be deleted' };
      if (/CHECK constraint/i.test(msg)) return { status: 400, message: 'Submitted data violates a data rule' };
      return { status: 400, message: 'Referenced record does not exist' };
    case 8152: // string truncation
    case 2628:
      return { status: 400, message: 'One of the values is too long' };
    default:
      return null;
  }
}

// Express recognises error handlers by their 4 parameters, so keep `next`
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Something went wrong. Please try again later.';
  let errors;

  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else {
    const known = normalize(err);
    if (known) {
      status = known.status;
      message = known.message;
    }
  }

  // Log unexpected errors fully on the server (redacted), never to the client
  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${status}`, {
      name: err.name,
      code: err.code,
      message: err.message,
      stack: config.isProd ? undefined : err.stack,
    });
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  if (!config.isProd && status >= 500) body.debug = err.message; // development only

  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
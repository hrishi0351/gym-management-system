'use strict';

/**
 * Success:  { success: true,  message, data, meta? }
 * Failure:  { success: false, message, errors? }
 */
const success = (res, data = null, message = 'Success', statusCode = 200, meta = undefined) => {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta; // e.g. pagination info
  return res.status(statusCode).json(body);
};

const created = (res, data = null, message = 'Created successfully') =>
  success(res, data, message, 201);

const failure = (res, message = 'Request failed', statusCode = 400, errors = undefined) => {
  const body = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(statusCode).json(body);
};

module.exports = { success, created, failure };
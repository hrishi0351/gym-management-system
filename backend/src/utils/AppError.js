'use strict';

class AppError extends Error {
  /**
   * @param {string} message  Safe message shown to the client
   * @param {number} statusCode  HTTP status code
   * @param {Array}  errors  Optional field errors: [{ field, message }]
   */
  constructor(message, statusCode = 500, errors = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // marks this as an expected, safe-to-show error
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors) {
    return new AppError(message, 400, errors);
  }
  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401);
  }
  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(message, 403);
  }
  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }
  static conflict(message = 'Resource already exists') {
    return new AppError(message, 409);
  }
  static tooMany(message = 'Too many requests, please try again later') {
    return new AppError(message, 429);
  }
}

module.exports = AppError;
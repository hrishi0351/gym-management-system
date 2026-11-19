'use strict';

const { body } = require('express-validator');
const { passwordProblems } = require('../utils/passwordPolicy');

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Required on create; on update the field may be absent (but not null). */
function field(name, label, isUpdate) {
  const chain = isUpdate ? body(name).optional() : body(name);
  return chain.exists({ checkNull: true }).withMessage(`${label} is required`).bail();
}

const nameRule = (name, label, isUpdate) =>
  field(name, label, isUpdate)
    .isString().withMessage(`${label} is invalid`).bail()
    .trim()
    .notEmpty().withMessage(`${label} is required`).bail()
    .isLength({ max: 60 }).withMessage(`${label} must be at most 60 characters`).bail()
    .matches(NAME_RE).withMessage(`${label} contains invalid characters`);

const emailRule = (name = 'email') =>
  body(name)
    .exists({ checkNull: true }).withMessage('Email is required').bail()
    .isString().withMessage('Email is invalid').bail()
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Enter a valid email address').bail()
    .isLength({ max: 255 }).withMessage('Email is too long');

const phoneRule = (name = 'phone') =>
  body(name)
    .optional({ values: 'falsy' })
    .isString().bail()
    .trim()
    .matches(PHONE_RE).withMessage('Enter a valid phone number');

const passwordRule = (name, label = 'Password') =>
  body(name)
    .isString().withMessage(`${label} is required`).bail()
    .custom((value) => {
      const problems = passwordProblems(value);
      if (problems.length) throw new Error(`${label} must have: ${problems.join(', ')}`);
      return true;
    });

const textRule = (name, label, max) =>
  body(name)
    .optional({ values: 'falsy' })
    .isString().withMessage(`${label} is invalid`).bail()
    .trim()
    .isLength({ max }).withMessage(`${label} must be at most ${max} characters`);

const dateRule = (name, label, { notFuture = false } = {}) =>
  body(name)
    .optional({ values: 'falsy' })
    .matches(DATE_RE).withMessage(`${label} must be in YYYY-MM-DD format`).bail()
    .isISO8601({ strict: true }).withMessage(`${label} is not a valid date`).bail()
    .custom((value) => {
      const d = new Date(value);
      if (d.getUTCFullYear() < 1900) throw new Error(`${label} is not a valid date`);
      if (notFuture && d > new Date()) throw new Error(`${label} cannot be in the future`);
      return true;
    });

module.exports = { field, nameRule, emailRule, phoneRule, passwordRule, textRule, dateRule, DATE_RE };
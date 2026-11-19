'use strict';

const { body } = require('express-validator');
const { passwordProblems } = require('../utils/passwordPolicy');

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

const nameField = (field, label) =>
  body(field)
    .trim()
    .notEmpty().withMessage(`${label} is required`).bail()
    .isLength({ max: 60 }).withMessage(`${label} must be at most 60 characters`).bail()
    .matches(NAME_RE).withMessage(`${label} contains invalid characters`);

const emailField = () =>
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Enter a valid email address').bail()
    .isLength({ max: 255 }).withMessage('Email is too long');

const passwordField = (field = 'password', label = 'Password') =>
  body(field)
    .isString().withMessage(`${label} is required`).bail()
    .custom((value) => {
      const problems = passwordProblems(value);
      if (problems.length) throw new Error(`${label} must have: ${problems.join(', ')}`);
      return true;
    });

const register = [
  nameField('firstName', 'First name'),
  nameField('lastName', 'Last name'),
  emailField(),
  body('phone').optional({ values: 'falsy' }).trim().matches(PHONE_RE).withMessage('Enter a valid phone number'),
  passwordField('password', 'Password'),
];

const login = [
  emailField(),
  body('password')
    .isString().withMessage('Password is required').bail()
    .notEmpty().withMessage('Password is required').bail()
    .isLength({ max: 128 }).withMessage('Password is too long'),
];

const forgotPassword = [emailField()];

const resetPassword = [
  body('token')
    .isString().bail()
    .isHexadecimal().bail()
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token'),
  passwordField('newPassword', 'New password'),
];

const changePassword = [
  body('currentPassword')
    .isString().withMessage('Current password is required').bail()
    .notEmpty().withMessage('Current password is required').bail()
    .isLength({ max: 128 }).withMessage('Password is too long'),
  passwordField('newPassword', 'New password'),
];

module.exports = { register, login, forgotPassword, resetPassword, changePassword };
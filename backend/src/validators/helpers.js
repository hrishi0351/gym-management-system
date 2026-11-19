'use strict';

const { query, body } = require('express-validator');
const { isRealDate } = require('../utils/dates');

const check = (name) => (value) => {
  if (!isRealDate(String(value))) throw new Error(`${name} must be a valid date (YYYY-MM-DD)`);
  return true;
};

/** ?name=YYYY-MM-DD */
const dateQuery = (name, { required = false } = {}) =>
  (required ? query(name).exists().withMessage(`${name} is required`).bail() : query(name).optional()).custom(check(name));

/** { name: 'YYYY-MM-DD' } */
const dateBody = (name, { required = false } = {}) =>
  (required ? body(name).exists({ checkNull: true }).withMessage(`${name} is required`).bail() : body(name).optional()).custom(
    check(name)
  );

module.exports = { dateQuery, dateBody };
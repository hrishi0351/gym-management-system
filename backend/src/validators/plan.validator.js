'use strict';

const { body } = require('express-validator');

const TYPES = ['monthly', 'quarterly', 'half_yearly', 'yearly', 'custom'];

function rules(isUpdate) {
  const f = (name, label) => {
    const chain = isUpdate ? body(name).optional() : body(name);
    return chain.exists({ checkNull: true }).withMessage(`${label} is required`).bail();
  };
  return [
    f('name', 'Name').isString().bail().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    f('planType', 'Plan type').isIn(TYPES).withMessage(`Plan type must be one of: ${TYPES.join(', ')}`),
    f('durationDays', 'Duration').isInt({ min: 1, max: 3650 }).withMessage('Duration must be 1-3650 days').toInt(),
    f('price', 'Price').isFloat({ min: 0, max: 10000000 }).withMessage('Price must be 0 or more').toFloat(),
    body('description').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 500 })
      .withMessage('Description must be at most 500 characters'),
    body('features').optional({ values: 'null' }).isArray({ max: 12 }).withMessage('Features must be a list of up to 12 items'),
    body('features.*').isString().bail().trim().isLength({ min: 1, max: 100 })
      .withMessage('Each feature must be 1-100 characters'),
    body('isPopular').optional().isBoolean().withMessage('isPopular must be true or false').toBoolean(),
    body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
  ];
}

module.exports = { create: rules(false), update: rules(true) };
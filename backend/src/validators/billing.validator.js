'use strict';

const { body, query } = require('express-validator');
const s = require('./shared');
const { paging } = require('./common.validator');

const METHODS = ['cash', 'card', 'upi', 'bank_transfer', 'online', 'other'];

/** Payment fields. `prefix` is 'initialPayment.' when nested; `gate` skips them when the parent is absent. */
function paymentFields(prefix, gate) {
  const f = (name) => {
    const chain = body(`${prefix}${name}`);
    return gate ? chain.if(gate) : chain;
  };
  return [
    f('amount')
      .exists({ checkNull: true }).withMessage('Amount is required').bail()
      .isDecimal({ decimal_digits: '0,2' }).withMessage('Enter a valid amount (max 2 decimals)').bail()
      .isFloat({ min: 0.01, max: 10000000 }).withMessage('Amount must be greater than 0')
      .toFloat(),
    f('method').optional({ values: 'falsy' }).isIn(METHODS).withMessage(`Method must be one of: ${METHODS.join(', ')}`),
    f('transactionRef').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 100 })
      .withMessage('Transaction reference must be at most 100 characters'),
    f('notes').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 255 })
      .withMessage('Notes must be at most 255 characters'),
    f('paidAt').optional({ values: 'falsy' }).isISO8601().withMessage('Payment date is invalid').bail()
      .custom((v) => {
        if (new Date(v) > new Date(Date.now() + 5 * 60 * 1000)) throw new Error('Payment date cannot be in the future');
        return true;
      }),
  ];
}

const createMembership = [
  body('memberId').exists({ checkNull: true }).withMessage('Member is required').bail()
    .isInt({ min: 1 }).withMessage('Invalid member').toInt(),
  body('planId').exists({ checkNull: true }).withMessage('Plan is required').bail()
    .isInt({ min: 1 }).withMessage('Invalid plan').toInt(),
  s.dateRule('startDate', 'Start date'),
  body('amountTotal').optional({ values: 'null' })
    .isFloat({ min: 0, max: 10000000 }).withMessage('Amount must be 0 or more').toFloat(),
  body('initialPayment').optional({ values: 'null' }).isObject().withMessage('initialPayment must be an object'),
  ...paymentFields('initialPayment.', body('initialPayment').exists({ checkNull: true })),
];

const membershipStatus = [
  body('status').isIn(['active', 'frozen', 'cancelled']).withMessage('Status must be active, frozen or cancelled'),
];

const recordPayment = [
  body('membershipId').exists({ checkNull: true }).withMessage('Membership is required').bail()
    .isInt({ min: 1 }).withMessage('Invalid membership').toInt(),
  ...paymentFields('', null),
];

const paymentStatus = [body('status').isIn(['refunded']).withMessage('Status must be refunded')];

const listMemberships = [
  ...paging,
  query('status').optional().isIn(['pending', 'active', 'expired', 'cancelled', 'frozen']).withMessage('Invalid status'),
  query('paymentStatus').optional().isIn(['unpaid', 'partial', 'paid', 'refunded']).withMessage('Invalid payment status'),
  query('memberId').optional().isInt({ min: 1 }).withMessage('Invalid member').toInt(),
];

const listPayments = [
  ...paging,
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid status'),
  query('method').optional().isIn(METHODS).withMessage('Invalid method'),
  query('memberId').optional().isInt({ min: 1 }).withMessage('Invalid member').toInt(),
  query('membershipId').optional().isInt({ min: 1 }).withMessage('Invalid membership').toInt(),
  query('from').optional().matches(s.DATE_RE).withMessage('from must be YYYY-MM-DD'),
  query('to').optional().matches(s.DATE_RE).withMessage('to must be YYYY-MM-DD'),
];

module.exports = {
  createMembership,
  membershipStatus,
  recordPayment,
  paymentStatus,
  listMemberships,
  listPayments,
};
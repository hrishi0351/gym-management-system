'use strict';

const { body, query } = require('express-validator');
const s = require('./shared');
const { paging } = require('./common.validator');

const plainText = (name, label, min, max, { required = true } = {}) => {
  const chain = required ? body(name).exists({ checkNull: true }).withMessage(`${label} is required`).bail() : body(name).optional({ values: 'falsy' });
  return chain
    .isString().withMessage(`${label} is invalid`).bail()
    .trim()
    .isLength({ min, max }).withMessage(`${label} must be ${min}-${max} characters`);
};

// "website" is a hidden honeypot field: real visitors never fill it
const honeypot = body('website').optional().isString().isLength({ max: 200 });

const enquiry = [
  plainText('name', 'Name', 2, 120),
  s.emailRule(),
  s.phoneRule(),
  body('planId').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('Invalid plan').toInt(),
  plainText('message', 'Message', 2, 1000, { required: false }),
  honeypot,
];

const contact = [
  plainText('name', 'Name', 2, 120),
  s.emailRule(),
  plainText('subject', 'Subject', 3, 200),
  plainText('message', 'Message', 10, 2000),
  honeypot,
];

const listEnquiries = [
  ...paging,
  query('status').optional().isIn(['new', 'contacted', 'converted', 'closed']).withMessage('Invalid status'),
];

const updateEnquiry = [
  body('status').optional().isIn(['new', 'contacted', 'converted', 'closed']).withMessage('Invalid status'),
  body('adminNotes').optional({ values: 'null' }).isString().bail().trim().isLength({ max: 500 })
    .withMessage('Notes must be at most 500 characters'),
];

const listContacts = [
  ...paging,
  query('isRead').optional().isBoolean().withMessage('isRead must be true or false').toBoolean(),
];

const markRead = [body('isRead').isBoolean().withMessage('isRead must be true or false').toBoolean()];

module.exports = { enquiry, contact, listEnquiries, updateEnquiry, listContacts, markRead };
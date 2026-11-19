'use strict';

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success, created } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const pick = require('../utils/pick');
const enquiryModel = require('../models/enquiry.model');
const contactModel = require('../models/contact.model');
const inboxService = require('../services/inbox.service');

const THANKS_ENQUIRY = 'Thank you! Our team will contact you soon.';
const THANKS_CONTACT = 'Thank you! Your message has been sent.';

// ---------------- public forms ----------------
exports.submitEnquiry = asyncHandler(async (req, res) => {
  // Bots fill the hidden "website" field. Pretend success, save nothing.
  if (req.body.website) return created(res, null, THANKS_ENQUIRY);
  await inboxService.submitEnquiry(pick(req.body, ['name', 'email', 'phone', 'planId', 'message']), req);
  return created(res, null, THANKS_ENQUIRY);
});

exports.submitContact = asyncHandler(async (req, res) => {
  if (req.body.website) return created(res, null, THANKS_CONTACT);
  await inboxService.submitContact(pick(req.body, ['name', 'email', 'subject', 'message']), req);
  return created(res, null, THANKS_CONTACT);
});

// ---------------- admin: enquiries ----------------
exports.listEnquiries = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total } = await enquiryModel.list({ status: req.query.status, search: req.query.search }, { limit, offset });
  return success(res, rows, 'Enquiries loaded', 200, buildMeta(page, limit, total));
});

exports.getEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await enquiryModel.findById(Number(req.params.id));
  if (!enquiry) throw AppError.notFound('Enquiry not found');
  return success(res, enquiry, 'Enquiry loaded');
});

exports.updateEnquiry = asyncHandler(async (req, res) =>
  success(
    res,
    await inboxService.updateEnquiry(Number(req.params.id), pick(req.body, ['status', 'adminNotes']), req),
    'Enquiry updated'
  )
);

exports.deleteEnquiry = asyncHandler(async (req, res) => {
  await inboxService.removeEnquiry(Number(req.params.id), req);
  return success(res, null, 'Enquiry deleted');
});

// ---------------- admin: contact messages ----------------
exports.listContacts = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, total, unread } = await contactModel.list({ isRead: req.query.isRead, search: req.query.search }, { limit, offset });
  return success(res, rows, 'Messages loaded', 200, buildMeta(page, limit, total, { unread }));
});

// Opening a message marks it as read
exports.getContact = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const message = await contactModel.findById(id);
  if (!message) throw AppError.notFound('Message not found');
  if (!message.isRead) await contactModel.setRead(id, true);
  return success(res, { ...message, isRead: true }, 'Message loaded');
});

exports.setContactRead = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!(await contactModel.findById(id))) throw AppError.notFound('Message not found');
  await contactModel.setRead(id, req.body.isRead);
  return success(res, await contactModel.findById(id), 'Message updated');
});

exports.deleteContact = asyncHandler(async (req, res) => {
  await inboxService.removeContact(Number(req.params.id), req);
  return success(res, null, 'Message deleted');
});
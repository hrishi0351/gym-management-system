'use strict';

const db = require('../config/db');
const AppError = require('../utils/AppError');
const enquiryModel = require('../models/enquiry.model');
const contactModel = require('../models/contact.model');
const audit = require('./audit.service');

const ipOf = (req) => String(req.ip || '').slice(0, 45);

// ---------------- public submissions ----------------
async function submitEnquiry(data, req) {
  if (data.planId) {
    const plans = await db.query('SELECT id FROM membership_plans WHERE id = ? AND is_active = 1', [data.planId]);
    if (!plans.length) {
      throw AppError.badRequest('Selected plan is not available', [{ field: 'planId', message: 'Selected plan is not available' }]);
    }
  }
  // Same email + same message within an hour: accept silently, store once
  if (await enquiryModel.findRecentDuplicate(data.email, data.message)) return;
  await enquiryModel.insert({ ...data, ip: ipOf(req) });
}

async function submitContact(data, req) {
  if (await contactModel.findRecentDuplicate(data.email, data.subject, data.message)) return;
  await contactModel.insert({ ...data, ip: ipOf(req) });
}

// ---------------- admin actions (audited) ----------------
async function updateEnquiry(id, data, req) {
  if (!(await enquiryModel.findById(id))) throw AppError.notFound('Enquiry not found');
  await enquiryModel.update(id, data, req.user.id);
  await audit.log({ userId: req.user.id, action: 'ENQUIRY_UPDATED', entityType: 'enquiry', entityId: id, details: data, req });
  return enquiryModel.findById(id);
}

async function removeEnquiry(id, req) {
  if (!(await enquiryModel.findById(id))) throw AppError.notFound('Enquiry not found');
  await enquiryModel.remove(id);
  await audit.log({ userId: req.user.id, action: 'ENQUIRY_DELETED', entityType: 'enquiry', entityId: id, req });
}

async function removeContact(id, req) {
  if (!(await contactModel.findById(id))) throw AppError.notFound('Message not found');
  await contactModel.remove(id);
  await audit.log({ userId: req.user.id, action: 'CONTACT_MESSAGE_DELETED', entityType: 'contact_message', entityId: id, req });
}

module.exports = { submitEnquiry, submitContact, updateEnquiry, removeEnquiry, removeContact };
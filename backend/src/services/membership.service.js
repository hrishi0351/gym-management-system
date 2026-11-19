'use strict';

const db = require('../config/db');
const AppError = require('../utils/AppError');
const membershipModel = require('../models/membership.model');
const paymentService = require('./payment.service');
const audit = require('./audit.service');

// Allowed manual status changes (pending -> active and active -> expired happen automatically)
const TRANSITIONS = {
  pending: ['cancelled'],
  active: ['frozen', 'cancelled'],
  frozen: ['active', 'cancelled'],
  expired: [],
  cancelled: [],
};

/** Creates a membership (and optionally its first payment) in ONE transaction. */
async function create(data, req) {
  const id = await db.withTransaction(async (tx) => {
    const members = await tx.query(
      'SELECT m.id FROM members m JOIN users u ON u.id = m.user_id WHERE m.id = ? AND u.deleted_at IS NULL',
      [data.memberId]
    );
    if (!members.length) throw AppError.notFound('Member not found');

    const plans = await tx.query('SELECT id, duration_days, price, is_active FROM membership_plans WHERE id = ?', [
      data.planId,
    ]);
    const plan = plans[0];
    if (!plan) throw AppError.notFound('Plan not found');
    if (!plan.is_active) throw AppError.badRequest('This plan is not active');

    const startDate = data.startDate || (await membershipModel.today(tx));
    const expiryDate = await membershipModel.computeExpiry(tx, startDate, plan.duration_days);

    const overlap = await membershipModel.findOverlap(tx, data.memberId, startDate, expiryDate);
    if (overlap) {
      throw AppError.conflict(
        `Member already has a membership until ${overlap.expiry_date}. Start the new one after that date.`
      );
    }

    const amountTotal = data.amountTotal != null ? data.amountTotal : plan.price; // price snapshot
    const membershipId = await membershipModel.insert(tx, {
      memberId: data.memberId,
      planId: plan.id,
      startDate,
      durationDays: plan.duration_days,
      amountTotal,
      createdBy: req.user.id,
    });

    if (data.initialPayment) {
      await paymentService.recordPaymentTx(tx, {
        membershipId,
        ...data.initialPayment,
        paidAt: data.initialPayment.paidAt ? new Date(data.initialPayment.paidAt) : null,
        recordedBy: req.user.id,
      });
    } else {
      await paymentService.syncMembership(tx, membershipId); // handles free (0 amount) memberships
    }
    return membershipId;
  });

  const membership = await membershipModel.findById(id);
  await audit.log({
    userId: req.user.id,
    action: 'MEMBERSHIP_CREATED',
    entityType: 'membership',
    entityId: id,
    details: { memberId: membership.memberId, planId: membership.planId, amountTotal: membership.amountTotal },
    req,
  });
  return membership;
}

async function updateStatus(id, status, req) {
  const current = await membershipModel.findById(id);
  if (!current) throw AppError.notFound('Membership not found');
  if (!TRANSITIONS[current.status].includes(status)) {
    throw AppError.badRequest(`Cannot change a membership from ${current.status} to ${status}`);
  }

  const { rowsAffected } = await db.execute(
    'UPDATE memberships SET status = ?, updated_at = SYSUTCDATETIME() WHERE id = ? AND status = ?',
    [status, id, current.status]
  );
  if (!rowsAffected) throw AppError.conflict('Membership was changed by someone else. Reload and try again.');

  await audit.log({
    userId: req.user.id,
    action: 'MEMBERSHIP_STATUS_CHANGED',
    entityType: 'membership',
    entityId: id,
    details: { from: current.status, to: status },
    req,
  });
  return membershipModel.findById(id);
}

module.exports = { create, updateStatus };
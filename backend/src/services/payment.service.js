'use strict';

const { withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const { TODAY } = require('../utils/sql');
const paymentModel = require('../models/payment.model');
const audit = require('./audit.service');

const toCents = (n) => Math.round(Number(n) * 100);

/**
 * Recomputes membership.payment_status from the payments table and activates a
 * pending membership once it has been paid (fully or partly) and its start date has arrived.
 * Must run inside the same transaction as the payment change.
 */
async function syncMembership(tx, membershipId) {
  const rows = await tx.query('SELECT amount_total FROM memberships WHERE id = ?', [membershipId]);
  const { paid, refunded } = await paymentModel.totals(tx, membershipId);
  const total = toCents(rows[0].amount_total);
  const paidCents = toCents(paid);

  let paymentStatus = 'unpaid';
  if (total === 0 || paidCents >= total) paymentStatus = 'paid';
  else if (paidCents > 0) paymentStatus = 'partial';
  else if (toCents(refunded) > 0) paymentStatus = 'refunded';

  // Business rule: any collected money (partial or full) activates the membership.
  // To require full payment, use: paymentStatus === 'paid'
  const grantsAccess = paymentStatus === 'paid' || paymentStatus === 'partial';

  await tx.execute(
    `UPDATE memberships
        SET payment_status = ?,
            status = CASE WHEN status = 'pending' AND ? = 1
                           AND start_date <= ${TODAY} AND expiry_date >= ${TODAY}
                          THEN 'active' ELSE status END,
            updated_at = SYSUTCDATETIME()
      WHERE id = ?`,
    [paymentStatus, grantsAccess, membershipId]
  );
  return paymentStatus;
}

/** Records one completed payment inside an existing transaction. Returns the payment id. */
async function recordPaymentTx(tx, p) {
  const memberships = await tx.query(
    'SELECT id, member_id, amount_total, status FROM memberships WITH (UPDLOCK, ROWLOCK) WHERE id = ?',
    [p.membershipId]
  );
  const membership = memberships[0];
  if (!membership) throw AppError.notFound('Membership not found');
  if (membership.status === 'cancelled') {
    throw AppError.badRequest('Cannot record a payment for a cancelled membership');
  }

  const { paid } = await paymentModel.totals(tx, membership.id);
  const balanceCents = toCents(membership.amount_total) - toCents(paid);
  if (toCents(p.amount) > balanceCents) {
    const message = `Payment exceeds the outstanding balance (${(balanceCents / 100).toFixed(2)})`;
    throw AppError.badRequest(message, [{ field: 'amount', message }]);
  }

  const id = await paymentModel.insert(tx, {
    membershipId: membership.id,
    memberId: membership.member_id,
    amount: p.amount,
    method: p.method || 'cash',
    status: 'completed',
    gateway: p.gateway || 'manual',
    transactionRef: p.transactionRef || null,
    paidAt: p.paidAt || new Date(),
    notes: p.notes || null,
    recordedBy: p.recordedBy || null,
  });
  await paymentModel.setReceipt(tx, id, `RCP-${new Date().getFullYear()}-${String(id).padStart(6, '0')}`);
  await syncMembership(tx, membership.id);
  return id;
}

async function recordPayment(data, req) {
  const id = await withTransaction((tx) =>
    recordPaymentTx(tx, {
      membershipId: data.membershipId,
      amount: data.amount,
      method: data.method,
      transactionRef: data.transactionRef,
      paidAt: data.paidAt ? new Date(data.paidAt) : null,
      notes: data.notes,
      recordedBy: req.user.id,
    })
  );
  const payment = await paymentModel.findById(id);
  await audit.log({
    userId: req.user.id,
    action: 'PAYMENT_RECORDED',
    entityType: 'payment',
    entityId: id,
    details: { receiptNo: payment.receiptNo, amount: payment.amount, membershipId: payment.membershipId },
    req,
  });
  return payment;
}

/** Only completed -> refunded for now. (Gateway statuses like pending/failed come with Razorpay.) */
async function updateStatus(id, status, req) {
  await withTransaction(async (tx) => {
    const found = await paymentModel.findById(id, tx);
    if (!found) throw AppError.notFound('Payment not found');

    // Lock order: membership first, then payment (same as recordPaymentTx)
    await tx.query('SELECT id FROM memberships WITH (UPDLOCK, ROWLOCK) WHERE id = ?', [found.membershipId]);
    const rows = await tx.query('SELECT status FROM payments WITH (UPDLOCK, ROWLOCK) WHERE id = ?', [id]);

    if (!(rows[0].status === 'completed' && status === 'refunded')) {
      throw AppError.badRequest(`Cannot change a payment from ${rows[0].status} to ${status}`);
    }
    await tx.execute('UPDATE payments SET status = ?, updated_at = SYSUTCDATETIME() WHERE id = ?', [status, id]);
    await syncMembership(tx, found.membershipId);
  });

  await audit.log({
    userId: req.user.id,
    action: 'PAYMENT_STATUS_CHANGED',
    entityType: 'payment',
    entityId: id,
    details: { status },
    req,
  });
  return paymentModel.findById(id);
}

module.exports = { recordPayment, recordPaymentTx, updateStatus, syncMembership };
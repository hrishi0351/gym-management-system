'use strict';

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success, created } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const pick = require('../utils/pick');
const membershipModel = require('../models/membership.model');
const paymentModel = require('../models/payment.model');
const membershipService = require('../services/membership.service');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status, paymentStatus, memberId, search } = req.query;
  const { rows, total } = await membershipModel.list({ status, paymentStatus, memberId, search }, { limit, offset });
  return success(res, rows, 'Memberships loaded', 200, buildMeta(page, limit, total));
});

exports.getOne = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const membership = await membershipModel.findById(id);
  if (!membership) throw AppError.notFound('Membership not found');
  const payments = await paymentModel.listForMembership(id);
  return success(res, { ...membership, payments }, 'Membership loaded');
});

exports.create = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['memberId', 'planId', 'startDate', 'amountTotal']);
  if (req.body.initialPayment) {
    data.initialPayment = pick(req.body.initialPayment, ['amount', 'method', 'transactionRef', 'notes', 'paidAt']);
  }
  return created(res, await membershipService.create(data, req), 'Membership created');
});

exports.updateStatus = asyncHandler(async (req, res) =>
  success(
    res,
    await membershipService.updateStatus(Number(req.params.id), req.body.status, req),
    'Membership updated'
  )
);
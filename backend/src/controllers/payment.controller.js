'use strict';

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success, created } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const pick = require('../utils/pick');
const paymentModel = require('../models/payment.model');
const paymentService = require('../services/payment.service');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { memberId, membershipId, status, method, from, to, search } = req.query;
  const { rows, total, completedTotal } = await paymentModel.list(
    { memberId, membershipId, status, method, from, to, search },
    { limit, offset }
  );
  return success(res, rows, 'Payments loaded', 200, buildMeta(page, limit, total, { completedTotal }));
});

exports.getOne = asyncHandler(async (req, res) => {
  const payment = await paymentModel.findById(Number(req.params.id));
  if (!payment) throw AppError.notFound('Payment not found');
  return success(res, payment, 'Payment loaded');
});

exports.record = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['membershipId', 'amount', 'method', 'transactionRef', 'notes', 'paidAt']);
  return created(res, await paymentService.recordPayment(data, req), 'Payment recorded');
});

exports.updateStatus = asyncHandler(async (req, res) =>
  success(
    res,
    await paymentService.updateStatus(Number(req.params.id), req.body.status, req),
    'Payment updated'
  )
);
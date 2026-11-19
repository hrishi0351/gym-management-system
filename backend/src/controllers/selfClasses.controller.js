'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const { parsePagination, buildMeta } = require('../utils/pagination');
const pick = require('../utils/pick');
const { isoWeekday } = require('../utils/dates');
const classModel = require('../models/class.model');
const bookingModel = require('../models/booking.model');
const classService = require('../services/class.service');
const bookingService = require('../services/booking.service');
const { SCHEDULE_FIELDS } = require('./class.controller');

// ======================= MEMBER =======================
const member = {
  classes: asyncHandler(async (req, res) => success(res, await classModel.listPublic(), 'Classes loaded')),

  // Slots running on one date, with seats left and whether I booked
  availability: asyncHandler(async (req, res) => {
    const { date } = req.query;
    const rows = await classModel.schedulesForDate(date, isoWeekday(date), req.profile.memberId);
    return success(res, rows, 'Availability loaded', 200, { date });
  }),

  bookings: asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { status, upcoming } = req.query;
    const { rows, total } = await bookingModel.listForMember(req.profile.memberId, { status, upcoming }, { limit, offset });
    return success(res, rows, 'Bookings loaded', 200, buildMeta(page, limit, total));
  }),

  book: asyncHandler(async (req, res) =>
    created(
      res,
      await bookingService.book(req.profile.memberId, { scheduleId: req.body.scheduleId, date: req.body.date }, req),
      'Class booked'
    )
  ),

  cancel: asyncHandler(async (req, res) =>
    success(res, await bookingService.cancel(req.profile.memberId, Number(req.params.id)), 'Booking cancelled')
  ),
};

// ======================= TRAINER =======================
const trainer = {
  classes: asyncHandler(async (req, res) =>
    success(res, await classModel.listByTrainer(req.profile.trainerId), 'Classes loaded')
  ),

  updateClass: asyncHandler(async (req, res) =>
    success(
      res,
      await classService.updateByTrainer(
        Number(req.params.id),
        req.profile.trainerId,
        pick(req.body, ['description', 'location']),
        req
      ),
      'Class updated'
    )
  ),

  addSchedule: asyncHandler(async (req, res) =>
    created(
      res,
      await classService.addSchedule(Number(req.params.id), pick(req.body, SCHEDULE_FIELDS), req, req.profile.trainerId),
      'Schedule added'
    )
  ),

  removeSchedule: asyncHandler(async (req, res) =>
    success(res, await classService.removeSchedule(Number(req.params.id), req, req.profile.trainerId), 'Schedule removed')
  ),

  bookings: asyncHandler(async (req, res) =>
    success(
      res,
      await classService.getBookings(Number(req.params.id), req.query.date, req.profile.trainerId),
      'Bookings loaded'
    )
  ),
};

module.exports = { member, trainer };
'use strict';

const db = require('../config/db');
const AppError = require('../utils/AppError');
const { diffDays, isoWeekday } = require('../utils/dates');
const bookingModel = require('../models/booking.model');

const MAX_DAYS_AHEAD = 14;

const fieldError = (field, message) => AppError.badRequest(message, [{ field, message }]);

async function book(memberId, { scheduleId, date }, req) {
  const id = await db.withTransaction(async (tx) => {
    const now = await bookingModel.nowIst(tx);

    const ahead = diffDays(date, now.d);
    if (ahead < 0) throw fieldError('date', 'You cannot book a class in the past');
    if (ahead > MAX_DAYS_AHEAD) throw fieldError('date', `You can book up to ${MAX_DAYS_AHEAD} days ahead`);

    // Locks this slot until the transaction ends, so the seat count below cannot go stale
    const slot = await bookingModel.lockSchedule(tx, scheduleId);
    if (!slot) throw AppError.notFound('Class slot not found');
    if (!slot.is_active) throw AppError.badRequest('This class is not active');
    if (isoWeekday(date) !== slot.day_of_week) {
      throw fieldError('date', 'This class does not run on the selected date');
    }
    if (ahead === 0 && slot.start_time <= now.t) throw AppError.badRequest('This class has already started');

    if (!(await bookingModel.hasActiveMembership(tx, memberId, date))) {
      throw AppError.forbidden('An active membership is required to book classes on that date');
    }

    const existing = await bookingModel.findExisting(tx, scheduleId, memberId, date);
    if (existing && existing.status !== 'cancelled') {
      throw AppError.conflict('You already have a booking for this class');
    }

    const taken = await bookingModel.countTaken(tx, scheduleId, date);
    if (taken >= slot.capacity) throw AppError.conflict('This class is full');

    if (existing) {
      await bookingModel.reactivate(tx, existing.id); // re-booking after a cancellation
      return existing.id;
    }
    return bookingModel.insert(tx, { scheduleId, memberId, date });
  });
  return bookingModel.findForMember(id, memberId);
}

async function cancel(memberId, bookingId) {
  const booking = await bookingModel.findForMember(bookingId, memberId);
  if (!booking) throw AppError.notFound('Booking not found');
  if (booking.status !== 'booked') throw AppError.badRequest(`This booking is already ${booking.status}`);

  const now = await bookingModel.nowIst(db);
  const ahead = diffDays(booking.date, now.d);
  if (ahead < 0 || (ahead === 0 && booking.startTime <= now.t)) {
    throw AppError.badRequest('This class has already started and cannot be cancelled');
  }

  await bookingModel.cancel(bookingId);
  return bookingModel.findForMember(bookingId, memberId);
}

module.exports = { book, cancel, MAX_DAYS_AHEAD };
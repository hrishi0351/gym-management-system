'use strict';

const db = require('../config/db');
const AppError = require('../utils/AppError');
const classModel = require('../models/class.model');
const bookingModel = require('../models/booking.model');
const audit = require('./audit.service');

const fieldError = (field, message) => AppError.badRequest(message, [{ field, message }]);

async function assertTrainer(conn, trainerId) {
  const rows = await conn.query(
    `SELECT t.id FROM trainers t JOIN users u ON u.id = t.user_id
      WHERE t.id = ? AND u.deleted_at IS NULL AND u.status = 'active'`,
    [trainerId]
  );
  if (!rows.length) throw fieldError('trainerId', 'Trainer not found or not active');
}

/** Adds one weekly slot. A trainer cannot teach two overlapping classes. */
async function addScheduleTx(tx, classId, trainerId, s) {
  if (!(s.endTime > s.startTime)) throw fieldError('endTime', 'End time must be after start time');
  if (trainerId) {
    const clash = await classModel.findTrainerConflict(tx, {
      trainerId,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    });
    if (clash) throw AppError.conflict(`Trainer already teaches "${clash.name}" at an overlapping time on that day`);
  }
  return classModel.insertSchedule(tx, classId, s);
}

const logClass = (req, action, id, details) =>
  audit.log({ userId: req.user.id, action, entityType: 'class', entityId: id, details, req });

async function create(data, req) {
  const { schedules = [], ...fields } = data;
  const classId = await db.withTransaction(async (tx) => {
    if (fields.trainerId) await assertTrainer(tx, fields.trainerId);
    const id = await classModel.insert(tx, fields);
    for (const s of schedules) await addScheduleTx(tx, id, fields.trainerId, s);
    return id;
  });
  await logClass(req, 'CLASS_CREATED', classId, { name: fields.name });
  return classModel.findById(classId);
}

async function update(id, data, req) {
  const existing = await classModel.findById(id);
  if (!existing) throw AppError.notFound('Class not found');

  await db.withTransaction(async (tx) => {
    const newTrainer = data.trainerId;
    if (newTrainer && newTrainer !== existing.trainerId) {
      await assertTrainer(tx, newTrainer);
      for (const s of existing.schedules) {
        const clash = await classModel.findTrainerConflict(tx, {
          trainerId: newTrainer,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        });
        if (clash) throw AppError.conflict(`That trainer already teaches "${clash.name}" at an overlapping time`);
      }
    }
    await classModel.update(tx, id, data);
  });

  await logClass(req, 'CLASS_UPDATED', id, Object.keys(data));
  return classModel.findById(id);
}

/** Trainers may only edit a few text fields of THEIR OWN classes */
async function updateByTrainer(id, trainerId, data, req) {
  const existing = await classModel.findById(id);
  if (!existing || existing.trainerId !== trainerId) throw AppError.notFound('Class not found');
  await classModel.update(db, id, data);
  await logClass(req, 'CLASS_UPDATED', id, Object.keys(data));
  return classModel.findById(id);
}

async function remove(id, req) {
  const cls = await classModel.findById(id);
  if (!cls) throw AppError.notFound('Class not found');
  const upcoming = await classModel.countFutureBookings({ classId: id });
  if (upcoming > 0) {
    throw AppError.conflict(`This class has ${upcoming} upcoming booking(s). Deactivate it instead of deleting.`);
  }
  await classModel.remove(id);
  await logClass(req, 'CLASS_DELETED', id, { name: cls.name });
}

/** ownerTrainerId is set when a trainer (not an admin) calls this */
async function addSchedule(classId, data, req, ownerTrainerId = null) {
  const cls = await classModel.findById(classId);
  if (!cls || (ownerTrainerId && cls.trainerId !== ownerTrainerId)) throw AppError.notFound('Class not found');

  const scheduleId = await db.withTransaction((tx) => addScheduleTx(tx, classId, cls.trainerId, data));
  await logClass(req, 'CLASS_SCHEDULE_ADDED', classId, { scheduleId, ...data });
  return classModel.findById(classId);
}

async function removeSchedule(scheduleId, req, ownerTrainerId = null) {
  const slot = await classModel.findSchedule(scheduleId);
  if (!slot || (ownerTrainerId && slot.trainer_id !== ownerTrainerId)) throw AppError.notFound('Schedule not found');

  const upcoming = await classModel.countFutureBookings({ scheduleId });
  if (upcoming > 0) {
    throw AppError.conflict(`This slot has ${upcoming} upcoming booking(s). Ask members to cancel first.`);
  }
  await classModel.deleteSchedule(scheduleId);
  await logClass(req, 'CLASS_SCHEDULE_REMOVED', slot.class_id, { scheduleId });
  return classModel.findById(slot.class_id);
}

/** Who is booked on a date (default today). trainerId limits a trainer to their own classes. */
async function getBookings(classId, date, trainerId = null) {
  const cls = await classModel.findById(classId);
  if (!cls || (trainerId && cls.trainerId !== trainerId)) throw AppError.notFound('Class not found');
  const day = date || (await bookingModel.nowIst(db)).d;
  const bookings = await classModel.bookingsForClassOnDate(classId, day);
  return { class: { id: cls.id, name: cls.name, capacity: cls.capacity }, date: day, bookings };
}

module.exports = { create, update, updateByTrainer, remove, addSchedule, removeSchedule, getBookings };
'use strict';

const express = require('express');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { idParam } = require('../validators/common.validator');
const planV = require('../validators/plan.validator');
const memberV = require('../validators/member.validator');
const trainerV = require('../validators/trainer.validator');
const billingV = require('../validators/billing.validator');
const classV = require('../validators/class.validator');
const attendanceV = require('../validators/attendance.validator');
const inboxV = require('../validators/inbox.validator');
const reportV = require('../validators/report.validator');
const adminV = require('../validators/admin.validator');
const planCtrl = require('../controllers/plan.controller');
const memberCtrl = require('../controllers/member.controller');
const trainerCtrl = require('../controllers/trainer.controller');
const membershipCtrl = require('../controllers/membership.controller');
const paymentCtrl = require('../controllers/payment.controller');
const attendanceCtrl = require('../controllers/attendance.controller');
const classCtrl = require('../controllers/class.controller');
const inboxCtrl = require('../controllers/inbox.controller');
const reportCtrl = require('../controllers/report.controller');
const adminCtrl = require('../controllers/admin.controller');

const router = express.Router();

// EVERY admin route requires a valid token AND the admin role
router.use(authenticate, authorize('admin'));

// ---------- Dashboard, profile, audit trail ----------
router.get('/dashboard', adminCtrl.dashboard);
router.get('/profile', adminCtrl.getProfile);
router.put('/profile', adminV.profile, validate, adminCtrl.updateProfile);
router.get('/activity-logs', adminV.activityLogs, validate, adminCtrl.activityLogs);

// ---------- Membership plans ----------
router.get('/plans', planCtrl.listAll);
router.get('/plans/:id', idParam(), validate, planCtrl.getOne);
router.post('/plans', planV.create, validate, planCtrl.create);
router.put('/plans/:id', idParam(), planV.update, validate, planCtrl.update);
router.delete('/plans/:id', idParam(), validate, planCtrl.remove);

// ---------- Members ----------
router.get('/members', memberV.list, validate, memberCtrl.list);
router.post('/members', memberV.create, validate, memberCtrl.create);
router.get('/members/:id', idParam(), validate, memberCtrl.getOne);
router.put('/members/:id', idParam(), memberV.update, validate, memberCtrl.update);
router.delete('/members/:id', idParam(), validate, memberCtrl.remove);
router.post('/members/:id/trainer', idParam(), trainerV.assign, validate, trainerCtrl.assignToMember);
router.delete('/members/:id/trainer', idParam(), validate, trainerCtrl.unassignMember);
router.get('/members/:id/attendance', idParam(), attendanceV.history, validate, attendanceCtrl.memberHistory);

// ---------- Trainers ----------
router.get('/trainers', trainerV.list, validate, trainerCtrl.list);
router.post('/trainers', trainerV.create, validate, trainerCtrl.create);
router.get('/trainers/:id', idParam(), validate, trainerCtrl.getOne);
router.put('/trainers/:id', idParam(), trainerV.update, validate, trainerCtrl.update);
router.delete('/trainers/:id', idParam(), validate, trainerCtrl.remove);

// ---------- Memberships ----------
router.get('/memberships', billingV.listMemberships, validate, membershipCtrl.list);
router.post('/memberships', billingV.createMembership, validate, membershipCtrl.create);
router.get('/memberships/:id', idParam(), validate, membershipCtrl.getOne);
router.patch('/memberships/:id/status', idParam(), billingV.membershipStatus, validate, membershipCtrl.updateStatus);

// ---------- Payments ----------
router.get('/payments', billingV.listPayments, validate, paymentCtrl.list);
router.post('/payments', billingV.recordPayment, validate, paymentCtrl.record);
router.get('/payments/:id', idParam(), validate, paymentCtrl.getOne);
router.patch('/payments/:id/status', idParam(), billingV.paymentStatus, validate, paymentCtrl.updateStatus);

// ---------- Attendance ----------
router.get('/attendance', attendanceV.list, validate, attendanceCtrl.list);
router.post('/attendance/check-in', attendanceV.checkInOut, validate, attendanceCtrl.checkIn);
router.post('/attendance/check-out', attendanceV.checkInOut, validate, attendanceCtrl.checkOut);

// ---------- Classes ----------
router.get('/classes', classV.list, validate, classCtrl.list);
router.post('/classes', classV.create, validate, classCtrl.create);
router.get('/classes/:id', idParam(), validate, classCtrl.getOne);
router.put('/classes/:id', idParam(), classV.update, validate, classCtrl.update);
router.delete('/classes/:id', idParam(), validate, classCtrl.remove);
router.post('/classes/:id/schedules', idParam(), classV.schedule, validate, classCtrl.addSchedule);
router.get('/classes/:id/bookings', idParam(), classV.bookingsQuery, validate, classCtrl.bookings);
router.delete('/schedules/:id', idParam(), validate, classCtrl.removeSchedule);

// ---------- Enquiries ----------
router.get('/enquiries', inboxV.listEnquiries, validate, inboxCtrl.listEnquiries);
router.get('/enquiries/:id', idParam(), validate, inboxCtrl.getEnquiry);
router.patch('/enquiries/:id', idParam(), inboxV.updateEnquiry, validate, inboxCtrl.updateEnquiry);
router.delete('/enquiries/:id', idParam(), validate, inboxCtrl.deleteEnquiry);

// ---------- Contact messages ----------
router.get('/contact-messages', inboxV.listContacts, validate, inboxCtrl.listContacts);
router.get('/contact-messages/:id', idParam(), validate, inboxCtrl.getContact);
router.patch('/contact-messages/:id/read', idParam(), inboxV.markRead, validate, inboxCtrl.setContactRead);
router.delete('/contact-messages/:id', idParam(), validate, inboxCtrl.deleteContact);

// ---------- Reports ----------
router.get('/reports/revenue', reportV.revenue, validate, reportCtrl.revenue);
router.get('/reports/memberships', reportCtrl.memberships);
router.get('/reports/attendance', reportV.range, validate, reportCtrl.attendance);
router.get('/reports/members', reportV.range, validate, reportCtrl.members);

module.exports = router;
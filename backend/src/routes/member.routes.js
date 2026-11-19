'use strict';

const express = require('express');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { requireMember } = require('../middleware/profile');
const memberV = require('../validators/member.validator');
const classV = require('../validators/class.validator');
const attendanceV = require('../validators/attendance.validator');
const { idParam, paging } = require('../validators/common.validator');
const { member } = require('../controllers/self.controller');
const selfClasses = require('../controllers/selfClasses.controller');
const attendanceCtrl = require('../controllers/attendance.controller');

const router = express.Router();

router.use(authenticate, authorize('member'), requireMember);

router.get('/profile', member.getProfile);
router.put('/profile', memberV.selfUpdate, validate, member.updateProfile);
router.get('/memberships', member.memberships);
router.get('/payments', paging, validate, member.payments);
router.get('/trainer', member.trainer);

router.get('/attendance', attendanceV.history, validate, attendanceCtrl.myHistory);

router.get('/classes', selfClasses.member.classes);
router.get('/classes/availability', classV.availability, validate, selfClasses.member.availability);
router.get('/bookings', classV.myBookings, validate, selfClasses.member.bookings);
router.post('/bookings', classV.book, validate, selfClasses.member.book);
router.delete('/bookings/:id', idParam(), validate, selfClasses.member.cancel);

module.exports = router;
'use strict';

const express = require('express');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { requireTrainer } = require('../middleware/profile');
const trainerV = require('../validators/trainer.validator');
const classV = require('../validators/class.validator');
const { idParam, paging } = require('../validators/common.validator');
const { trainer } = require('../controllers/self.controller');
const selfClasses = require('../controllers/selfClasses.controller');

const router = express.Router();

router.use(authenticate, authorize('trainer'), requireTrainer);

router.get('/profile', trainer.getProfile);
router.put('/profile', trainerV.selfUpdate, validate, trainer.updateProfile);
router.get('/members', paging, validate, trainer.members);
router.get('/members/:memberId', idParam('memberId'), validate, trainer.memberDetail);

// Own classes and schedules only (ownership is checked in the service)
router.get('/classes', selfClasses.trainer.classes);
router.put('/classes/:id', idParam(), classV.trainerUpdate, validate, selfClasses.trainer.updateClass);
router.post('/classes/:id/schedules', idParam(), classV.schedule, validate, selfClasses.trainer.addSchedule);
router.get('/classes/:id/bookings', idParam(), classV.bookingsQuery, validate, selfClasses.trainer.bookings);
router.delete('/schedules/:id', idParam(), validate, selfClasses.trainer.removeSchedule);

module.exports = router;
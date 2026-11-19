'use strict';

const express = require('express');
const validate = require('../middleware/validate');
const { formLimiter } = require('../middleware/rateLimit');
const inboxV = require('../validators/inbox.validator');
const planCtrl = require('../controllers/plan.controller');
const trainerCtrl = require('../controllers/trainer.controller');
const classCtrl = require('../controllers/class.controller');
const contentCtrl = require('../controllers/content.controller');
const inboxCtrl = require('../controllers/inbox.controller');

const router = express.Router();

router.get('/plans', planCtrl.listPublic);
router.get('/trainers', trainerCtrl.listPublic);
router.get('/classes', classCtrl.listPublic);
router.get('/facilities', contentCtrl.facilities);
router.get('/gallery', contentCtrl.gallery);

// Public forms: rate limited + honeypot + duplicate suppression
router.post('/enquiries', formLimiter, inboxV.enquiry, validate, inboxCtrl.submitEnquiry);
router.post('/contact', formLimiter, inboxV.contact, validate, inboxCtrl.submitContact);

module.exports = router;
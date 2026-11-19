'use strict';

const express = require('express');
const ctrl = require('../controllers/auth.controller');
const validators = require('../validators/auth.validator');
const validate = require('../middleware/validate');
const requireXhr = require('../middleware/requireXhr');
const { authenticate } = require('../middleware/auth');
const { authLimiter, loginLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.post('/register', authLimiter, validators.register, validate, ctrl.register);
router.post('/login', loginLimiter, validators.login, validate, ctrl.login);
router.post('/refresh', requireXhr, ctrl.refresh);
router.post('/logout', requireXhr, ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.post('/change-password', authenticate, validators.changePassword, validate, ctrl.changePassword);
router.post('/forgot-password', authLimiter, validators.forgotPassword, validate, ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validators.resetPassword, validate, ctrl.resetPassword);

module.exports = router;
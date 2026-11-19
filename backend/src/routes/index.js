'use strict';

const express = require('express');

const router = express.Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/public', require('./public.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/member', require('./member.routes'));
router.use('/trainer', require('./trainer.routes'));

module.exports = router;
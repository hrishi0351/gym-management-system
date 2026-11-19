'use strict';

const express = require('express');
const { testConnection } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { success, failure } = require('../utils/apiResponse');

const router = express.Router();

// GET /api/v1/health
router.get(
  '/',
  asyncHandler(async (req, res) => {
    try {
      await testConnection();
    } catch (error) {
      // Generic message: never reveal DB host, user or error details
      return failure(res, 'Service unavailable', 503);
    }
    return success(res, {
      status: 'ok',
      database: 'connected',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    }, 'API is healthy');
  })
);

module.exports = router;
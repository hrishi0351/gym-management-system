'use strict';

const { execute } = require('../config/db');
const logger = require('../utils/logger');

async function log({ userId = null, action, entityType = null, entityId = null, details = null, req = null }) {
  try {
    await execute(
      `INSERT INTO admin_activity_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        action,
        entityType,
        entityId,
        details ? JSON.stringify(logger.redact(details)) : null,
        req ? String(req.ip || '').slice(0, 45) : null,
        req ? String(req.get('user-agent') || '').slice(0, 255) : null,
      ]
    );
  } catch (error) {
    logger.error('Audit log write failed', { message: error.message });
  }
}

module.exports = { log };
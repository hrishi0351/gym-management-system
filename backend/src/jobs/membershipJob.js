'use strict';

const { execute } = require('../config/db');
const { TODAY } = require('../utils/sql');
const logger = require('../utils/logger');

async function run() {
  try {
    const expired = await execute(
      `UPDATE memberships SET status = 'expired', updated_at = SYSUTCDATETIME()
        WHERE status IN ('active', 'pending') AND expiry_date < ${TODAY}`
    );
    const activated = await execute(
      `UPDATE memberships SET status = 'active', updated_at = SYSUTCDATETIME()
        WHERE status = 'pending' AND payment_status IN ('paid', 'partial')
          AND start_date <= ${TODAY} AND expiry_date >= ${TODAY}`
    );
    if (expired.rowsAffected || activated.rowsAffected) {
      logger.info('Membership job done', { expired: expired.rowsAffected, activated: activated.rowsAffected });
    }
  } catch (error) {
    logger.error('Membership job failed', { message: error.message });
  }
}

function start() {
  run();
  setInterval(run, 60 * 60 * 1000).unref(); // every hour; unref() lets the server exit cleanly
}

module.exports = { start, run };
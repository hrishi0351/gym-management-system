'use strict';

const config = require('../config/env');
const logger = require('../utils/logger');

async function sendPasswordReset(user, resetUrl) {
  if (config.isProd) {
    // TODO (deployment): send a real email via SMTP here
    logger.warn('Password reset requested but SMTP is not configured');
    return;
  }
  // Development only: show the link in the terminal
  console.log('\n================ PASSWORD RESET (dev only) ================');
  console.log(`To:   ${user.email}`);
  console.log(`Link: ${resetUrl}`);
  console.log('Expires in 30 minutes\n===========================================================\n');
}

module.exports = { sendPasswordReset };
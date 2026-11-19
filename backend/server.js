'use strict';

// env.js must be loaded first: it reads .env and validates it
const config = require('./src/config/env');
const app = require('./src/app');
const { close, testConnection } = require('./src/config/db');
const logger = require('./src/utils/logger');

async function start() {
  try {
    await testConnection();
    logger.info(`Database connection OK (database: ${config.db.database})`);
  } catch (error) {
    logger.error('Could not connect to MySQL. Check DB_* values in backend/.env', {
      code: error.code,
      message: error.message,
    });
    process.exit(1);
  }

  // const server = app.listen(config.port, () => {
  //   logger.info(`API running at http://localhost:${config.port}/api/v1 (${config.env})`);
  // });
    const server = app.listen(config.port, () => {
    logger.info(`API running at http://localhost:${config.port}/api/v1 (${config.env})`);
    require('./src/jobs/membershipJob').start();
  });

  // Graceful shutdown: stop accepting requests, close DB pool, exit
  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
        await close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref(); // force-exit after 10s
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

start();
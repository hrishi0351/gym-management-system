'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = process.env;

// ---------- Fail fast on missing / placeholder secrets ----------
const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_ACCESS_SECRET'];
const missing = required.filter((key) => !env[key] || env[key].trim() === '');

const problems = [];
if (missing.length) problems.push(`Missing variables: ${missing.join(', ')}`);
if (env.DB_PASSWORD && env.DB_PASSWORD.startsWith('replace_with')) {
  problems.push('DB_PASSWORD still has the placeholder value.');
}
if (env.JWT_ACCESS_SECRET && env.JWT_ACCESS_SECRET.length < 64) {
  problems.push('JWT_ACCESS_SECRET must be at least 64 characters (use the node command from .env.example).');
}

const nodeEnv = env.NODE_ENV || 'development';
if (nodeEnv === 'production' && env.COOKIE_SECURE !== 'true') {
  problems.push('COOKIE_SECURE must be "true" in production.');
}

if (problems.length) {
  console.error('\n[CONFIG ERROR] Fix backend/.env and restart:');
  problems.forEach((p) => console.error(' - ' + p));
  process.exit(1);
}

// ---------- Helpers ----------
const toInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? fallback : n;
};

// ---------- Exported config ----------
module.exports = Object.freeze({
  env: nodeEnv,
  isProd: nodeEnv === 'production',
  port: toInt(env.PORT, 5000),
  clientUrl: env.CLIENT_URL || 'http://localhost:5173',

   db: {
    host: env.DB_HOST,
    port: toInt(env.DB_PORT, 1433),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectionLimit: toInt(env.DB_CONNECTION_LIMIT, 10),
    encrypt: env.DB_ENCRYPT === 'true',
    trustServerCertificate: env.DB_TRUST_SERVER_CERT !== 'false',
  },

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN || '15m',
  },

  refreshTokenTtlDays: toInt(env.REFRESH_TOKEN_TTL_DAYS, 7),
  bcryptRounds: toInt(env.BCRYPT_ROUNDS, 12),
  maxFailedLogins: toInt(env.MAX_FAILED_LOGINS, 5),
  lockoutMinutes: toInt(env.LOCKOUT_MINUTES, 15),

  cookie: {
    secure: env.COOKIE_SECURE === 'true',
    sameSite: env.COOKIE_SAME_SITE || 'strict',
  },

  rateLimit: {
    windowMinutes: toInt(env.RATE_LIMIT_WINDOW_MINUTES, 15),
    max: toInt(env.RATE_LIMIT_MAX, 300),
    authMax: toInt(env.AUTH_RATE_LIMIT_MAX, 10),
  },

  payment: {
    gateway: env.PAYMENT_GATEWAY || 'manual',
  },
});
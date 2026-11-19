'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const ISSUER = 'gym-api';

function signAccessToken(user) {
  return jwt.sign({ role: user.role }, config.jwt.accessSecret, {
    subject: String(user.id),
    expiresIn: config.jwt.accessExpiresIn,
    algorithm: 'HS256',
    issuer: ISSUER,
  });
}

function verifyAccessToken(token) {
  // algorithms is pinned, so "alg: none" and algorithm-swap attacks fail
  return jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'], issuer: ISSUER });
}

const generateOpaqueToken = (bytes = 64) => crypto.randomBytes(bytes).toString('hex');
const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

module.exports = { signAccessToken, verifyAccessToken, generateOpaqueToken, hashToken };
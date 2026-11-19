'use strict';

const xss = require('xss');

const SKIP_KEYS = /pass(word)?|token/i;
const XSS_OPTIONS = { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] };
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function clean(value, key = '', depth = 0) {
  if (depth > 6) return value;
  if (typeof value === 'string') {
    if (SKIP_KEYS.test(key)) return value;
    return xss(value, XSS_OPTIONS).replace(/\0/g, '').trim();
  }
  if (Array.isArray(value)) return value.map((v) => clean(v, key, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(k)) continue;
      out[k] = clean(v, k, depth + 1);
    }
    return out;
  }
  return value;
}

module.exports = function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.query && typeof req.query === 'object') req.query = clean(req.query);
  next();
};
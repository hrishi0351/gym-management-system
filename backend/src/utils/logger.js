'use strict';

const SENSITIVE_KEY = /pass(word)?|token|secret|authorization|cookie|hash/i;

// Recursively replaces values of sensitive keys with "[REDACTED]"
function redact(value, depth = 0) {
  if (value === null || typeof value !== 'object' || depth > 4) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));

  const out = {};
  for (const [key, val] of Object.entries(value)) {
    out[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(val, depth + 1);
  }
  return out;
}

function write(level, message, meta) {
  const time = new Date().toISOString();
  const line = `${time} [${level}] ${message}`;
  const stream = level === 'ERROR' || level === 'WARN' ? console.error : console.log;
  if (meta !== undefined) {
    stream(line, JSON.stringify(redact(meta)));
  } else {
    stream(line);
  }
}

module.exports = {
  info: (message, meta) => write('INFO', message, meta),
  warn: (message, meta) => write('WARN', message, meta),
  error: (message, meta) => write('ERROR', message, meta),
  redact,
};
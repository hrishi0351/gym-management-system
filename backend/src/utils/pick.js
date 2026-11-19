'use strict';

function pick(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source && source[key] !== undefined) out[key] = source[key] === '' ? null : source[key];
  }
  return out;
}

module.exports = pick;
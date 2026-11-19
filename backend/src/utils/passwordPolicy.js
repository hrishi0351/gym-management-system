'use strict';

/** Returns a list of unmet requirements (empty array = password is OK). */
function passwordProblems(password) {
  if (typeof password !== 'string' || password.length === 0) return ['a password'];
  const problems = [];
  if (password.length < 12) problems.push('at least 12 characters');
  if (Buffer.byteLength(password, 'utf8') > 72) problems.push('at most 72 bytes (bcrypt limit)');
  if (!/[a-z]/.test(password)) problems.push('a lowercase letter');
  if (!/[A-Z]/.test(password)) problems.push('an uppercase letter');
  if (!/\d/.test(password)) problems.push('a digit');
  if (!/[^A-Za-z0-9]/.test(password)) problems.push('a symbol');
  return problems;
}

module.exports = { passwordProblems };
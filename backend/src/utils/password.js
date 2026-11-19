'use strict';

const bcrypt = require('bcrypt');
const config = require('../config/env');

const hashPassword = (plain) => bcrypt.hash(plain, config.bcryptRounds);
const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

// Used when the email doesn't exist, so the response time looks the same
let dummyHash;
async function fakeCompare(plain) {
  if (!dummyHash) dummyHash = await bcrypt.hash('not-a-real-password', config.bcryptRounds);
  await bcrypt.compare(String(plain), dummyHash);
}

module.exports = { hashPassword, comparePassword, fakeCompare };
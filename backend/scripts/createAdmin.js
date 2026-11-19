'use strict';

// Loads and validates backend/.env (same as the server)
require('../src/config/env');
const { query, execute, close } = require('../src/config/db');
const { hashPassword } = require('../src/utils/password');
const { passwordProblems } = require('../src/utils/passwordPolicy');

async function main() {
  const email = String(process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || '';

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error('SEED_ADMIN_EMAIL is missing or invalid in .env');
  const problems = passwordProblems(password);
  if (problems.length || password.startsWith('replace_with')) {
    throw new Error(`SEED_ADMIN_PASSWORD in .env must have: ${problems.join(', ') || 'a real value'}`);
  }

  const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    console.log(`Admin already exists (${email}). Nothing changed.`);
    return;
  }

  const roles = await query('SELECT id FROM roles WHERE name = ?', ['admin']);
  if (!roles.length) throw new Error('Role "admin" not found. Run database/sqlserver/seed.sql first.');

  const hash = await hashPassword(password);
  await execute(
    `INSERT INTO users (role_id, email, password_hash, first_name, last_name, password_changed_at)
     VALUES (?, ?, ?, ?, ?, SYSUTCDATETIME())`,
    [roles[0].id, email, hash, 'Gym', 'Admin']
  );
  console.log(`Admin created: ${email}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(close);
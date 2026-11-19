'use strict';

const db = require('../config/db');
const { buildUpdate } = require('../utils/sql');

const COLUMNS = `id, name, plan_type, duration_days, price, description, features,
                 is_popular, is_active, created_at`;

function toPlan(row) {
  if (!row) return null;
  let features = [];
  try {
    features = row.features ? JSON.parse(row.features) : [];
  } catch (_) {
    features = [];
  }
  return {
    id: row.id,
    name: row.name,
    planType: row.plan_type,
    durationDays: row.duration_days,
    price: row.price,
    description: row.description,
    features,
    isPopular: !!row.is_popular,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  };
}

async function listActive() {
  const rows = await db.query(`SELECT ${COLUMNS} FROM membership_plans WHERE is_active = 1 ORDER BY duration_days, id`);
  return rows.map(toPlan);
}

async function listAll() {
  const rows = await db.query(`SELECT ${COLUMNS} FROM membership_plans ORDER BY duration_days, id`);
  return rows.map(toPlan);
}

async function findById(id) {
  const rows = await db.query(`SELECT ${COLUMNS} FROM membership_plans WHERE id = ?`, [id]);
  return toPlan(rows[0]);
}

async function findByName(name) {
  const rows = await db.query('SELECT id FROM membership_plans WHERE name = ?', [name]);
  return rows[0] || null;
}

async function create(data) {
  const rows = await db.query(
    `INSERT INTO membership_plans
       (name, plan_type, duration_days, price, description, features, is_popular, is_active)
     OUTPUT INSERTED.id
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.planType,
      data.durationDays,
      data.price,
      data.description ?? null,
      data.features ? JSON.stringify(data.features) : null,
      !!data.isPopular,
      data.isActive === undefined ? true : !!data.isActive,
    ]
  );
  return findById(rows[0].id);
}

const ALLOWED = {
  name: 'name',
  planType: 'plan_type',
  durationDays: 'duration_days',
  price: 'price',
  description: 'description',
  features: 'features',
  isPopular: 'is_popular',
  isActive: 'is_active',
};

async function update(id, data) {
  const payload = { ...data };
  if (payload.features !== undefined) {
    payload.features = payload.features ? JSON.stringify(payload.features) : null;
  }
  const { sets, params } = buildUpdate(payload, ALLOWED);
  if (sets.length) {
    await db.execute(
      `UPDATE membership_plans SET ${sets.join(', ')}, updated_at = SYSUTCDATETIME() WHERE id = ?`,
      [...params, id]
    );
  }
  return findById(id);
}

async function countMemberships(planId) {
  const rows = await db.query('SELECT COUNT(*) AS c FROM memberships WHERE plan_id = ?', [planId]);
  return rows[0].c;
}

async function remove(id) {
  await db.execute('DELETE FROM membership_plans WHERE id = ?', [id]);
}

module.exports = { listActive, listAll, findById, findByName, create, update, countMemberships, remove };
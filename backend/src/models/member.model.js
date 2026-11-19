'use strict';

const db = require('../config/db');
const { dateOut, buildUpdate } = require('../utils/sql');
const { likeTerm } = require('../utils/pagination');

// Each member row + their latest non-cancelled membership
const LIST_FROM = `
  FROM members m
  JOIN users u ON u.id = m.user_id
  OUTER APPLY (
    SELECT TOP 1 x.id, x.status, x.expiry_date, x.plan_id
      FROM memberships x
     WHERE x.member_id = m.id AND x.status <> 'cancelled'
     ORDER BY x.expiry_date DESC, x.id DESC
  ) ms
  LEFT JOIN membership_plans p ON p.id = ms.plan_id`;

const toListItem = (r) => ({
  id: r.id,
  memberCode: r.member_code,
  firstName: r.first_name,
  lastName: r.last_name,
  email: r.email,
  phone: r.phone,
  status: r.status,
  joinedOn: r.joined_on,
  membership: r.membership_id
    ? { id: r.membership_id, status: r.membership_status, expiryDate: r.expiry_date, planName: r.plan_name }
    : null,
});

function buildListFilter({ search, status, membership }) {
  const where = ['u.deleted_at IS NULL'];
  const params = [];
  if (search) {
    const t = likeTerm(search);
    where.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR CONCAT(u.first_name, ' ', u.last_name) LIKE ?
                 OR u.email LIKE ? OR u.phone LIKE ? OR m.member_code LIKE ?)`);
    params.push(t, t, t, t, t, t);
  }
  if (status) {
    where.push('u.status = ?');
    params.push(status);
  }
  if (membership === 'none') {
    where.push('ms.id IS NULL');
  } else if (membership) {
    where.push('ms.status = ?');
    params.push(membership);
  }
  return { whereSql: `WHERE ${where.join(' AND ')}`, params };
}

async function list(filters, { limit, offset }) {
  const { whereSql, params } = buildListFilter(filters);
  const rows = await db.query(
    `SELECT m.id, m.member_code, u.first_name, u.last_name, u.email, u.phone, u.status,
            ${dateOut('m.joined_on')} AS joined_on,
            ms.id AS membership_id, ms.status AS membership_status,
            ${dateOut('ms.expiry_date')} AS expiry_date, p.name AS plan_name
       ${LIST_FROM} ${whereSql}
      ORDER BY m.id DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(`SELECT COUNT(*) AS total ${LIST_FROM} ${whereSql}`, params);
  return { rows: rows.map(toListItem), total: count[0].total };
}

// ---------------- detail ----------------
const DETAIL_SELECT = `
  SELECT m.id, m.user_id, m.member_code, ${dateOut('m.date_of_birth')} AS date_of_birth, m.gender,
         m.address, m.city, m.state, m.postal_code, m.emergency_contact_name, m.emergency_contact_phone,
         m.height_cm, m.weight_kg, m.health_notes, m.profile_photo, ${dateOut('m.joined_on')} AS joined_on,
         u.first_name, u.last_name, u.email, u.phone, u.status
    FROM members m
    JOIN users u ON u.id = m.user_id`;

const toDetail = (r) =>
  r && {
    id: r.id,
    userId: r.user_id,
    memberCode: r.member_code,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    status: r.status,
    dateOfBirth: r.date_of_birth,
    gender: r.gender,
    address: r.address,
    city: r.city,
    state: r.state,
    postalCode: r.postal_code,
    emergencyContactName: r.emergency_contact_name,
    emergencyContactPhone: r.emergency_contact_phone,
    heightCm: r.height_cm,
    weightKg: r.weight_kg,
    healthNotes: r.health_notes,
    profilePhoto: r.profile_photo,
    joinedOn: r.joined_on,
  };

async function findById(id) {
  const rows = await db.query(`${DETAIL_SELECT} WHERE m.id = ? AND u.deleted_at IS NULL`, [id]);
  return toDetail(rows[0]) || null;
}

async function findByUserId(userId) {
  const rows = await db.query(`${DETAIL_SELECT} WHERE m.user_id = ? AND u.deleted_at IS NULL`, [userId]);
  return toDetail(rows[0]) || null;
}

// ---------------- update ----------------
const USER_FIELDS = { firstName: 'first_name', lastName: 'last_name', phone: 'phone' };
const ADMIN_USER_FIELDS = { ...USER_FIELDS, status: 'status' };
const MEMBER_FIELDS = {
  dateOfBirth: 'date_of_birth',
  gender: 'gender',
  address: 'address',
  city: 'city',
  state: 'state',
  postalCode: 'postal_code',
  emergencyContactName: 'emergency_contact_name',
  emergencyContactPhone: 'emergency_contact_phone',
  heightCm: 'height_cm',
  weightKg: 'weight_kg',
  healthNotes: 'health_notes',
};

/** conn = db or a transaction (tx). Only whitelisted fields are written. */
async function update(conn, { memberId, userId }, data, isAdmin) {
  const u = buildUpdate(data, isAdmin ? ADMIN_USER_FIELDS : USER_FIELDS);
  if (u.sets.length) {
    await conn.execute(`UPDATE users SET ${u.sets.join(', ')}, updated_at = SYSUTCDATETIME() WHERE id = ?`, [
      ...u.params,
      userId,
    ]);
  }
  const m = buildUpdate(data, MEMBER_FIELDS);
  if (m.sets.length) {
    await conn.execute(`UPDATE members SET ${m.sets.join(', ')}, updated_at = SYSUTCDATETIME() WHERE id = ?`, [
      ...m.params,
      memberId,
    ]);
  }
}

module.exports = { list, findById, findByUserId, update };
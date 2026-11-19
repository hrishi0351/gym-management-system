'use strict';

const db = require('../config/db');
const { TODAY, dateOut, buildUpdate } = require('../utils/sql');
const { likeTerm } = require('../utils/pagination');

const COLUMNS = `
  t.id, t.user_id, t.specialization, t.bio, t.experience_years, t.certifications, t.photo_url,
  t.is_featured, ${dateOut('t.hired_on')} AS hired_on,
  u.first_name, u.last_name, u.email, u.phone, u.status`;
const FROM = 'FROM trainers t JOIN users u ON u.id = t.user_id';

const toTrainer = (r) =>
  r && {
    id: r.id,
    userId: r.user_id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    phone: r.phone,
    status: r.status,
    specialization: r.specialization,
    bio: r.bio,
    experienceYears: r.experience_years,
    certifications: r.certifications,
    photoUrl: r.photo_url,
    isFeatured: !!r.is_featured,
    hiredOn: r.hired_on,
    ...(r.member_count !== undefined ? { memberCount: r.member_count } : {}),
  };

// Public website: no email / phone
const toPublic = (t) => ({
  id: t.id,
  firstName: t.firstName,
  lastName: t.lastName,
  specialization: t.specialization,
  bio: t.bio,
  experienceYears: t.experienceYears,
  certifications: t.certifications,
  photoUrl: t.photoUrl,
  isFeatured: t.isFeatured,
});

async function listPublic() {
  const rows = await db.query(
    `SELECT ${COLUMNS} ${FROM}
      WHERE u.deleted_at IS NULL AND u.status = 'active'
      ORDER BY t.is_featured DESC, t.id`
  );
  return rows.map(toTrainer).map(toPublic);
}

async function list({ search }, { limit, offset }) {
  const where = ['u.deleted_at IS NULL'];
  const params = [];
  if (search) {
    const t = likeTerm(search);
    where.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR t.specialization LIKE ?)`);
    params.push(t, t, t, t);
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;
  const rows = await db.query(
    `SELECT ${COLUMNS},
            (SELECT COUNT(*) FROM trainer_assignments a WHERE a.trainer_id = t.id AND a.is_active = 1) AS member_count
       ${FROM} ${whereSql}
      ORDER BY t.id DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(`SELECT COUNT(*) AS total ${FROM} ${whereSql}`, params);
  return { rows: rows.map(toTrainer), total: count[0].total };
}

async function findById(id) {
  const rows = await db.query(`SELECT ${COLUMNS} ${FROM} WHERE t.id = ? AND u.deleted_at IS NULL`, [id]);
  return toTrainer(rows[0]) || null;
}

async function findByUserId(userId) {
  const rows = await db.query(`SELECT ${COLUMNS} ${FROM} WHERE t.user_id = ? AND u.deleted_at IS NULL`, [userId]);
  return toTrainer(rows[0]) || null;
}

/** Creates users + trainers rows. Call inside a transaction (tx). Returns the trainer id. */
async function createWithUser(tx, d) {
  const roles = await tx.query('SELECT id FROM roles WHERE name = ?', ['trainer']);
  if (!roles.length) throw new Error('Role "trainer" not found. Run database/sqlserver/seed.sql first.');

  const users = await tx.query(
    `INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone, password_changed_at)
     OUTPUT INSERTED.id
     VALUES (?, ?, ?, ?, ?, ?, SYSUTCDATETIME())`,
    [roles[0].id, d.email, d.passwordHash, d.firstName, d.lastName, d.phone || null]
  );
  const trainers = await tx.query(
    `INSERT INTO trainers (user_id, specialization, bio, experience_years, certifications, is_featured, hired_on)
     OUTPUT INSERTED.id
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      users[0].id,
      d.specialization ?? null,
      d.bio ?? null,
      d.experienceYears ?? 0,
      d.certifications ?? null,
      !!d.isFeatured,
      d.hiredOn ?? null,
    ]
  );
  return trainers[0].id;
}

const USER_FIELDS = { firstName: 'first_name', lastName: 'last_name', phone: 'phone' };
const ADMIN_USER_FIELDS = { ...USER_FIELDS, status: 'status' };
const SELF_TRAINER_FIELDS = { specialization: 'specialization', bio: 'bio', certifications: 'certifications' };
const ADMIN_TRAINER_FIELDS = {
  ...SELF_TRAINER_FIELDS,
  experienceYears: 'experience_years',
  isFeatured: 'is_featured',
  hiredOn: 'hired_on',
};

async function update(conn, { trainerId, userId }, data, isAdmin) {
  const u = buildUpdate(data, isAdmin ? ADMIN_USER_FIELDS : USER_FIELDS);
  if (u.sets.length) {
    await conn.execute(`UPDATE users SET ${u.sets.join(', ')}, updated_at = SYSUTCDATETIME() WHERE id = ?`, [
      ...u.params,
      userId,
    ]);
  }
  const t = buildUpdate(data, isAdmin ? ADMIN_TRAINER_FIELDS : SELF_TRAINER_FIELDS);
  if (t.sets.length) {
    await conn.execute(`UPDATE trainers SET ${t.sets.join(', ')}, updated_at = SYSUTCDATETIME() WHERE id = ?`, [
      ...t.params,
      trainerId,
    ]);
  }
}

// ---------------- assignments ----------------
async function activeTrainerForMember(memberId) {
  const rows = await db.query(
    `SELECT t.id, u.first_name, u.last_name, t.specialization, ${dateOut('a.assigned_on')} AS assigned_on
       FROM trainer_assignments a
       JOIN trainers t ON t.id = a.trainer_id
       JOIN users u ON u.id = t.user_id
      WHERE a.member_id = ? AND a.is_active = 1`,
    [memberId]
  );
  const r = rows[0];
  return r
    ? {
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        specialization: r.specialization,
        assignedOn: r.assigned_on,
      }
    : null;
}

async function isAssigned(trainerId, memberId) {
  const rows = await db.query(
    'SELECT id FROM trainer_assignments WHERE trainer_id = ? AND member_id = ? AND is_active = 1',
    [trainerId, memberId]
  );
  return rows.length > 0;
}

async function listAssignedMembers(trainerId, { search }, { limit, offset }) {
  const where = ['a.trainer_id = ?', 'a.is_active = 1', 'u.deleted_at IS NULL'];
  const params = [trainerId];
  if (search) {
    const t = likeTerm(search);
    where.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR m.member_code LIKE ?)');
    params.push(t, t, t);
  }
  const from = `
    FROM trainer_assignments a
    JOIN members m ON m.id = a.member_id
    JOIN users u ON u.id = m.user_id
    OUTER APPLY (
      SELECT TOP 1 x.status, x.expiry_date FROM memberships x
       WHERE x.member_id = m.id AND x.status <> 'cancelled'
       ORDER BY x.expiry_date DESC, x.id DESC
    ) ms
    WHERE ${where.join(' AND ')}`;
  const rows = await db.query(
    `SELECT m.id, m.member_code, u.first_name, u.last_name, u.phone,
            ${dateOut('a.assigned_on')} AS assigned_on,
            ms.status AS membership_status, ${dateOut('ms.expiry_date')} AS expiry_date
       ${from}
      ORDER BY u.first_name, u.last_name
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(`SELECT COUNT(*) AS total ${from}`, params);
  return {
    rows: rows.map((r) => ({
      id: r.id,
      memberCode: r.member_code,
      firstName: r.first_name,
      lastName: r.last_name,
      phone: r.phone,
      assignedOn: r.assigned_on,
      membershipStatus: r.membership_status,
      expiryDate: r.expiry_date,
    })),
    total: count[0].total,
  };
}

module.exports = {
  listPublic,
  list,
  findById,
  findByUserId,
  createWithUser,
  update,
  activeTrainerForMember,
  isAssigned,
  listAssignedMembers,
  TODAY,
};
'use strict';

const db = require('../config/db');
const { TODAY, dateOut, localDate } = require('../utils/sql');

// ---------------------------------------------------------------- dashboard
async function dashboardCounts() {
  const rows = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM members m JOIN users u ON u.id = m.user_id WHERE u.deleted_at IS NULL) AS total_members,
      (SELECT COUNT(*) FROM trainers t JOIN users u ON u.id = t.user_id WHERE u.deleted_at IS NULL) AS total_trainers,
      (SELECT COUNT(*) FROM memberships WHERE status = 'active') AS active_memberships,
      (SELECT COUNT(*) FROM memberships WHERE status = 'expired') AS expired_memberships,
      (SELECT COUNT(*) FROM memberships WHERE status = 'pending') AS pending_memberships,
      (SELECT COUNT(*) FROM memberships WHERE status = 'active'
          AND expiry_date >= ${TODAY} AND expiry_date <= DATEADD(DAY, 7, ${TODAY})) AS expiring_soon,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') AS total_revenue,
      (SELECT COALESCE(SUM(amount), 0) FROM payments
        WHERE status = 'completed'
          AND ${localDate('paid_at')} >= DATEFROMPARTS(YEAR(${TODAY}), MONTH(${TODAY}), 1)) AS revenue_this_month,
      (SELECT COUNT(*) FROM attendance WHERE attendance_date = ${TODAY}) AS today_check_ins,
      (SELECT COUNT(*) FROM attendance WHERE attendance_date = ${TODAY} AND check_out_at IS NULL) AS currently_in_gym,
      (SELECT COUNT(*) FROM enquiries WHERE status = 'new') AS new_enquiries,
      (SELECT COUNT(*) FROM contact_messages WHERE is_read = 0) AS unread_messages`);
  const r = rows[0];
  return {
    totalMembers: r.total_members,
    totalTrainers: r.total_trainers,
    activeMemberships: r.active_memberships,
    expiredMemberships: r.expired_memberships,
    pendingMemberships: r.pending_memberships,
    expiringSoon: r.expiring_soon,
    totalRevenue: r.total_revenue,
    revenueThisMonth: r.revenue_this_month,
    todayCheckIns: r.today_check_ins,
    currentlyInGym: r.currently_in_gym,
    newEnquiries: r.new_enquiries,
    unreadMessages: r.unread_messages,
  };
}

async function membershipStatusCounts() {
  const rows = await db.query('SELECT status, COUNT(*) AS total FROM memberships GROUP BY status ORDER BY status');
  return rows.map((r) => ({ status: r.status, count: r.total }));
}

// ---------------------------------------------------------------- revenue
async function revenue(from, to, groupBy) {
  const len = groupBy === 'month' ? 7 : 10; // 'YYYY-MM' or 'YYYY-MM-DD'
  const range = 'x.d >= CAST(? AS date) AND x.d <= CAST(? AS date)';
  const apply = `FROM payments pay CROSS APPLY (SELECT ${localDate('pay.paid_at')} AS d) x`;

  const series = await db.query(
    `SELECT CONVERT(varchar(${len}), x.d, 23) AS period, COUNT(*) AS payments, SUM(pay.amount) AS total
       ${apply}
      WHERE pay.status = 'completed' AND ${range}
      GROUP BY CONVERT(varchar(${len}), x.d, 23)
      ORDER BY period`,
    [from, to]
  );
  const byMethod = await db.query(
    `SELECT pay.method, COUNT(*) AS payments, SUM(pay.amount) AS total
       ${apply}
      WHERE pay.status = 'completed' AND ${range}
      GROUP BY pay.method
      ORDER BY total DESC`,
    [from, to]
  );
  const refunded = await db.query(
    `SELECT COALESCE(SUM(pay.amount), 0) AS total
       ${apply}
      WHERE pay.status = 'refunded' AND ${range}`,
    [from, to]
  );
  return {
    series: series.map((r) => ({ period: r.period, payments: r.payments, total: r.total })),
    byMethod: byMethod.map((r) => ({ method: r.method, payments: r.payments, total: r.total })),
    totalRevenue: series.reduce((sum, r) => sum + r.total, 0),
    totalPayments: series.reduce((sum, r) => sum + r.payments, 0),
    refundedTotal: refunded[0].total,
  };
}

// ---------------------------------------------------------------- memberships
async function expiringSoon(days, limit) {
  const rows = await db.query(
    `SELECT TOP (?) ms.id, ms.membership_code, ${dateOut('ms.expiry_date')} AS expiry_date,
            DATEDIFF(DAY, ${TODAY}, ms.expiry_date) AS days_left,
            m.id AS member_id, m.member_code, u.first_name, u.last_name, u.phone, p.name AS plan_name
       FROM memberships ms
       JOIN members m ON m.id = ms.member_id
       JOIN users u ON u.id = m.user_id
       JOIN membership_plans p ON p.id = ms.plan_id
      WHERE ms.status = 'active' AND u.deleted_at IS NULL
        AND ms.expiry_date >= ${TODAY} AND ms.expiry_date <= DATEADD(DAY, ?, ${TODAY})
      ORDER BY ms.expiry_date, ms.id`,
    [limit, days]
  );
  return rows.map((r) => ({
    membershipId: r.id,
    membershipCode: r.membership_code,
    expiryDate: r.expiry_date,
    daysLeft: r.days_left,
    memberId: r.member_id,
    memberCode: r.member_code,
    memberName: `${r.first_name} ${r.last_name}`,
    phone: r.phone,
    planName: r.plan_name,
  }));
}

const PAID_SUBQUERY = `
  (SELECT membership_id, SUM(amount) AS paid FROM payments WHERE status = 'completed' GROUP BY membership_id)`;

async function membershipsOverview() {
  const byPlan = await db.query(
    `SELECT p.id, p.name, COUNT(ms.id) AS memberships,
            COALESCE(SUM(CASE WHEN ms.status = 'active' THEN 1 ELSE 0 END), 0) AS active_count,
            COALESCE(SUM(pp.paid), 0) AS revenue
       FROM membership_plans p
       LEFT JOIN memberships ms ON ms.plan_id = p.id
       LEFT JOIN ${PAID_SUBQUERY} pp ON pp.membership_id = ms.id
      GROUP BY p.id, p.name
      ORDER BY p.id`
  );
  const dues = await db.query(
    `SELECT TOP 50 ms.id, ms.membership_code, m.member_code, u.first_name, u.last_name, u.phone,
            ms.amount_total, COALESCE(pp.paid, 0) AS paid,
            ms.amount_total - COALESCE(pp.paid, 0) AS due
       FROM memberships ms
       JOIN members m ON m.id = ms.member_id
       JOIN users u ON u.id = m.user_id
       LEFT JOIN ${PAID_SUBQUERY} pp ON pp.membership_id = ms.id
      WHERE ms.status <> 'cancelled' AND u.deleted_at IS NULL
        AND ms.amount_total - COALESCE(pp.paid, 0) > 0
      ORDER BY due DESC`
  );
  return {
    statusCounts: await membershipStatusCounts(),
    byPlan: byPlan.map((r) => ({
      planId: r.id,
      name: r.name,
      memberships: r.memberships,
      active: r.active_count,
      revenue: r.revenue,
    })),
    outstandingDues: dues.map((r) => ({
      membershipId: r.id,
      membershipCode: r.membership_code,
      memberCode: r.member_code,
      memberName: `${r.first_name} ${r.last_name}`,
      phone: r.phone,
      amountTotal: r.amount_total,
      paid: r.paid,
      due: r.due,
    })),
    expiringIn30Days: await expiringSoon(30, 50),
  };
}

// ---------------------------------------------------------------- attendance
async function attendanceReport(from, to) {
  const range = 'a.attendance_date >= CAST(? AS date) AND a.attendance_date <= CAST(? AS date)';
  const params = [from, to];

  const daily = await db.query(
    `SELECT ${dateOut('a.attendance_date')} AS day, COUNT(*) AS check_ins
       FROM attendance a WHERE ${range}
      GROUP BY a.attendance_date ORDER BY a.attendance_date`,
    params
  );
  const byHour = await db.query(
    `SELECT x.h AS hour, COUNT(*) AS check_ins
       FROM attendance a
       CROSS APPLY (SELECT DATEPART(HOUR, a.check_in_at AT TIME ZONE 'UTC' AT TIME ZONE 'India Standard Time') AS h) x
      WHERE ${range}
      GROUP BY x.h ORDER BY x.h`,
    params
  );
  const top = await db.query(
    `SELECT TOP 10 m.id, m.member_code, u.first_name, u.last_name, COUNT(*) AS visits
       FROM attendance a
       JOIN members m ON m.id = a.member_id
       JOIN users u ON u.id = m.user_id
      WHERE ${range}
      GROUP BY m.id, m.member_code, u.first_name, u.last_name
      ORDER BY visits DESC, m.id`,
    params
  );
  const totals = await db.query(
    `SELECT COUNT(*) AS total, COUNT(DISTINCT a.member_id) AS unique_members,
            AVG(CASE WHEN a.check_out_at IS NOT NULL THEN DATEDIFF(MINUTE, a.check_in_at, a.check_out_at) END) AS avg_minutes
       FROM attendance a WHERE ${range}`,
    params
  );
  return {
    totalCheckIns: totals[0].total,
    uniqueMembers: totals[0].unique_members,
    averageVisitMinutes: totals[0].avg_minutes,
    daily: daily.map((r) => ({ date: r.day, checkIns: r.check_ins })),
    byHour: byHour.map((r) => ({ hour: r.hour, checkIns: r.check_ins })),
    topMembers: top.map((r) => ({
      memberId: r.id,
      memberCode: r.member_code,
      memberName: `${r.first_name} ${r.last_name}`,
      visits: r.visits,
    })),
  };
}

// ---------------------------------------------------------------- members
async function newMembersByMonth(from, to) {
  const rows = await db.query(
    `SELECT CONVERT(varchar(7), m.joined_on, 23) AS period, COUNT(*) AS members
       FROM members m JOIN users u ON u.id = m.user_id
      WHERE u.deleted_at IS NULL AND m.joined_on >= CAST(? AS date) AND m.joined_on <= CAST(? AS date)
      GROUP BY CONVERT(varchar(7), m.joined_on, 23)
      ORDER BY period`,
    [from, to]
  );
  return rows.map((r) => ({ period: r.period, members: r.members }));
}

async function membersReport(from, to) {
  const gender = await db.query(
    `SELECT COALESCE(m.gender, 'unknown') AS gender, COUNT(*) AS total
       FROM members m JOIN users u ON u.id = m.user_id
      WHERE u.deleted_at IS NULL
      GROUP BY COALESCE(m.gender, 'unknown')`
  );
  const status = await db.query(
    `SELECT u.status, COUNT(*) AS total
       FROM members m JOIN users u ON u.id = m.user_id
      WHERE u.deleted_at IS NULL
      GROUP BY u.status`
  );
  const newByMonth = await newMembersByMonth(from, to);
  return {
    totalNewMembers: newByMonth.reduce((sum, r) => sum + r.members, 0),
    newByMonth,
    gender: gender.map((r) => ({ gender: r.gender, count: r.total })),
    accountStatus: status.map((r) => ({ status: r.status, count: r.total })),
  };
}

// ---------------------------------------------------------------- activity logs
async function activityLogs({ action, userId, from, to }, { limit, offset }) {
  const where = [];
  const params = [];
  if (action) {
    where.push('l.action = ?');
    params.push(action);
  }
  if (userId) {
    where.push('l.user_id = ?');
    params.push(userId);
  }
  if (from) {
    where.push(`${localDate('l.created_at')} >= CAST(? AS date)`);
    params.push(from);
  }
  if (to) {
    where.push(`${localDate('l.created_at')} <= CAST(? AS date)`);
    params.push(to);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = await db.query(
    `SELECT l.id, l.user_id, l.action, l.entity_type, l.entity_id, l.details, l.ip_address, l.created_at,
            u.first_name, u.last_name, u.email
       FROM admin_activity_logs l
       LEFT JOIN users u ON u.id = l.user_id
       ${whereSql}
      ORDER BY l.id DESC
     OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
    [...params, offset, limit]
  );
  const count = await db.query(`SELECT COUNT(*) AS total FROM admin_activity_logs l ${whereSql}`, params);
  return {
    rows: rows.map((r) => {
      let details = null;
      try {
        details = r.details ? JSON.parse(r.details) : null;
      } catch (_) {
        details = null;
      }
      return {
        id: r.id,
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        details,
        ipAddress: r.ip_address,
        createdAt: r.created_at,
        user: r.user_id ? { id: r.user_id, name: `${r.first_name} ${r.last_name}`, email: r.email } : null,
      };
    }),
    total: count[0].total,
  };
}

module.exports = {
  dashboardCounts,
  membershipStatusCounts,
  revenue,
  expiringSoon,
  membershipsOverview,
  attendanceReport,
  newMembersByMonth,
  membersReport,
  activityLogs,
};
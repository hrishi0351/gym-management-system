'use strict';

const config = require('../config/env');
const { withTransaction } = require('../config/db');
const AppError = require('../utils/AppError');
const { hashPassword, comparePassword, fakeCompare } = require('../utils/password');
const { signAccessToken, generateOpaqueToken, hashToken } = require('../utils/token');
const userModel = require('../models/user.model');
const tokenModel = require('../models/token.model');
const audit = require('./audit.service');
const emailService = require('./email.service');

const INVALID_LOGIN = 'Invalid email or password';
const DAY_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  firstName: u.first_name,
  lastName: u.last_name,
  phone: u.phone,
  role: u.role,
});

const clientMeta = (req) => ({
  ip: String(req.ip || '').slice(0, 45),
  userAgent: String(req.get('user-agent') || '').slice(0, 255),
});

/** Creates a refresh token row and signs an access token. */
async function issueSession(user, req, db = require('../config/db')) {
  const refreshToken = generateOpaqueToken(64);
  await tokenModel.createRefreshToken(db, {
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + config.refreshTokenTtlDays * DAY_MS),
    ...clientMeta(req),
  });
  return { accessToken: signAccessToken(user), refreshToken, user: publicUser(user) };
}

// ---------------------------------------------------------------- register
async function register(data, req) {
  const existing = await userModel.findByEmail(data.email);
  if (existing) throw AppError.conflict('An account with this email already exists');

  const passwordHash = await hashPassword(data.password);
  const user = await withTransaction((tx) =>
    userModel.createMember(tx, {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    })
  );

  const session = await issueSession(user, req);
  await audit.log({ userId: user.id, action: 'USER_REGISTERED', entityType: 'user', entityId: user.id, req });
  return session;
}

// ---------------------------------------------------------------- login
async function login({ email, password }, req) {
  const user = await userModel.findByEmail(email);

  if (!user || user.deleted_at) {
    await fakeCompare(password);
    throw AppError.unauthorized(INVALID_LOGIN);
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw AppError.tooMany('Account temporarily locked after too many failed attempts. Try again later.');
  }

  const passwordOk = await comparePassword(password, user.password_hash);
  if (!passwordOk) {
    await userModel.recordFailedLogin(user.id, config.maxFailedLogins, config.lockoutMinutes);
    if (user.role === 'admin') {
      await audit.log({ userId: user.id, action: 'LOGIN_FAILED', entityType: 'user', entityId: user.id, req });
    }
    throw AppError.unauthorized(INVALID_LOGIN);
  }

  if (user.status !== 'active') {
    throw AppError.forbidden('Your account is not active. Please contact the gym.');
  }

  await userModel.recordSuccessfulLogin(user.id);
  const session = await issueSession(user, req);
  if (user.role === 'admin') {
    await audit.log({ userId: user.id, action: 'LOGIN_SUCCESS', entityType: 'user', entityId: user.id, req });
  }
  return session;
}

// ---------------------------------------------------------------- refresh (rotation)
async function refresh(rawToken, req) {
  const expired = () => AppError.unauthorized('Session expired, please log in again');
  if (!rawToken) throw expired();

  const record = await tokenModel.findRefreshToken(hashToken(rawToken));
  if (!record) throw expired();

  if (record.revoked_at) {
    // A token that was already ROTATED is being used again.
    if (record.replaced_by_hash) {
      // Two tabs refreshing at the same moment is normal, not theft: only treat reuse as
      // theft when the token was rotated more than a few seconds ago.
      const REUSE_GRACE_MS = 10 * 1000;
      const rotatedAgo = Date.now() - new Date(record.revoked_at).getTime();
      if (rotatedAgo > REUSE_GRACE_MS) {
        await tokenModel.revokeAllForUser(require('../config/db'), record.user_id);
        await audit.log({
          userId: record.user_id,
          action: 'REFRESH_TOKEN_REUSE_DETECTED',
          entityType: 'user',
          entityId: record.user_id,
          req,
        });
      }
    }
    throw expired();
  }
  if (new Date(record.expires_at) <= new Date()) throw expired();

  const user = await userModel.findById(record.user_id);
  if (!user || user.deleted_at || user.status !== 'active') throw expired();

  const newRaw = generateOpaqueToken(64);
  const newHash = hashToken(newRaw);

  await withTransaction(async (tx) => {
    // Only one concurrent request can win this update
    const won = await tokenModel.revokeRefreshToken(tx, record.id, newHash);
    if (won !== 1) throw expired();
    await tokenModel.createRefreshToken(tx, {
      userId: user.id,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + config.refreshTokenTtlDays * DAY_MS),
      ...clientMeta(req),
    });
  });

  return { accessToken: signAccessToken(user), refreshToken: newRaw, user: publicUser(user) };
}
// ---------------------------------------------------------------- logout
async function logout(rawToken) {
  if (rawToken) await tokenModel.revokeByHash(hashToken(rawToken));
}

// ---------------------------------------------------------------- me
async function getMe(userId) {
  const user = await userModel.findById(userId);
  if (!user) throw AppError.unauthorized();
  const profile = await userModel.getProfileIds(user.id, user.role);
  return { ...publicUser(user), ...profile };
}

// ---------------------------------------------------------------- change password
async function changePassword(userId, { currentPassword, newPassword }, req) {
  const user = await userModel.findById(userId);
  if (!user) throw AppError.unauthorized();

  const field = (name, message) => AppError.badRequest(message, [{ field: name, message }]);

  if (!(await comparePassword(currentPassword, user.password_hash))) {
    throw field('currentPassword', 'Current password is incorrect');
  }
  if (await comparePassword(newPassword, user.password_hash)) {
    throw field('newPassword', 'New password must be different from the current password');
  }

  const newHash = await hashPassword(newPassword);
  await withTransaction(async (tx) => {
    await userModel.updatePassword(tx, user.id, newHash);
    await tokenModel.revokeAllForUser(tx, user.id); // log out everywhere
  });

  await audit.log({ userId: user.id, action: 'PASSWORD_CHANGED', entityType: 'user', entityId: user.id, req });
}

// ---------------------------------------------------------------- forgot / reset password
async function forgotPassword(email, req) {
  const user = await userModel.findByEmail(email);

  // Same response whether or not the account exists (prevents email enumeration)
  if (user && !user.deleted_at && user.status === 'active') {
    const rawToken = generateOpaqueToken(32);
    await withTransaction(async (tx) => {
      await tokenModel.invalidateResetTokens(tx, user.id);
      await tokenModel.createResetToken(tx, {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      });
    });
    await emailService.sendPasswordReset(user, `${config.clientUrl}/reset-password?token=${rawToken}`);
    await audit.log({ userId: user.id, action: 'PASSWORD_RESET_REQUESTED', entityType: 'user', entityId: user.id, req });
  }
}

async function resetPassword({ token, newPassword }, req) {
  const invalid = () => AppError.badRequest('This reset link is invalid or has expired');

  const record = await tokenModel.findValidResetToken(hashToken(token));
  if (!record) throw invalid();

  const newHash = await hashPassword(newPassword);
  await withTransaction(async (tx) => {
    if ((await tokenModel.markResetTokenUsed(tx, record.id)) !== 1) throw invalid(); // one-time use
    await userModel.updatePassword(tx, record.user_id, newHash);
    await tokenModel.revokeAllForUser(tx, record.user_id);
  });

  await audit.log({ userId: record.user_id, action: 'PASSWORD_RESET_COMPLETED', entityType: 'user', entityId: record.user_id, req });
}

module.exports = { register, login, refresh, logout, getMe, changePassword, forgotPassword, resetPassword };
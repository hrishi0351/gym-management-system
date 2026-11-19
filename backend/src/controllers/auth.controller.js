'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { success, created } = require('../utils/apiResponse');
const config = require('../config/env');
const authService = require('../services/auth.service');

const COOKIE_NAME = 'refreshToken';

const baseCookie = () => ({
  httpOnly: true,                     // not readable from JavaScript (XSS safe)
  secure: config.cookie.secure,       // true on HTTPS in production
  sameSite: config.cookie.sameSite,   // strict = never sent from other sites
  path: '/api/v1/auth',               // browser sends it only to auth endpoints
});

const setRefreshCookie = (res, token) =>
  res.cookie(COOKIE_NAME, token, { ...baseCookie(), maxAge: config.refreshTokenTtlDays * 24 * 60 * 60 * 1000 });

const clearRefreshCookie = (res) => res.clearCookie(COOKIE_NAME, baseCookie());

const sessionBody = (session) => ({ accessToken: session.accessToken, user: session.user });

exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body; // whitelist fields
  const session = await authService.register({ firstName, lastName, email, phone: phone || null, password }, req);
  setRefreshCookie(res, session.refreshToken);
  return created(res, sessionBody(session), 'Registration successful');
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const session = await authService.login({ email, password }, req);
  setRefreshCookie(res, session.refreshToken);
  return success(res, sessionBody(session), 'Login successful');
});

exports.refresh = asyncHandler(async (req, res) => {
  try {
    const session = await authService.refresh(req.cookies[COOKIE_NAME], req);
    setRefreshCookie(res, session.refreshToken);
    return success(res, sessionBody(session), 'Token refreshed');
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies[COOKIE_NAME]);
  clearRefreshCookie(res);
  return success(res, null, 'Logged out');
});

exports.me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  return success(res, user, 'Profile loaded');
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, { currentPassword, newPassword }, req);
  clearRefreshCookie(res);
  return success(res, null, 'Password changed. Please log in again.');
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email, req);
  return success(res, null, 'If an account with that email exists, a reset link has been sent.');
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  await authService.resetPassword({ token, newPassword }, req);
  return success(res, null, 'Password reset successful. You can now log in.');
});
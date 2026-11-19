'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');
const morgan = require('morgan');

const config = require('./config/env');
const routes = require('./routes');
const sanitizeInput = require('./middleware/sanitize');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Not behind a proxy locally. Set this when deploying behind Nginx/a load balancer:
// app.set('trust proxy', 1);

app.disable('x-powered-by');

// ---------- Security headers ----------
app.use(helmet());

// ---------- CORS: only our frontend may call the API ----------
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true, // needed for the refresh-token cookie
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 600,
  })
);

// ---------- Request logging (never logs bodies, so no passwords) ----------
app.use(morgan(config.isProd ? 'combined' : 'dev'));

// ---------- Body parsing with small size limits ----------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// ---------- Input hardening ----------
app.use(hpp());          // blocks ?a=1&a=2 parameter pollution
app.use(sanitizeInput);  // strips HTML/scripts from all text input

// ---------- Rate limiting + routes ----------
app.use('/api/v1', apiLimiter);
app.use('/api/v1', routes);

// ---------- 404 + central error handler (must be last) ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
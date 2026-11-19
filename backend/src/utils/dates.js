'use strict';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toUtc = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms) => new Date(ms).toISOString().slice(0, 10);

/** True only for real calendar dates in YYYY-MM-DD (rejects 2026-02-31). */
const isRealDate = (s) => typeof s === 'string' && DATE_RE.test(s) && fromUtc(toUtc(s)) === s;

const addDays = (s, n) => fromUtc(toUtc(s) + n * 86400000);
const diffDays = (a, b) => Math.round((toUtc(a) - toUtc(b)) / 86400000); // a - b

/** ISO weekday: 1 = Monday ... 7 = Sunday (same as class_schedules.day_of_week) */
const isoWeekday = (s) => {
  const d = new Date(toUtc(s)).getUTCDay();
  return d === 0 ? 7 : d;
};

/** ['2026-06', ..., '2026-11'] : the last `count` months ending at `today`'s month */
function monthKeys(today, count) {
  const [y, m] = today.split('-').map(Number);
  const base = y * 12 + (m - 1);
  const keys = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const idx = base - i;
    keys.push(`${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, '0')}`);
  }
  return keys;
}

module.exports = { DATE_RE, isRealDate, addDays, diffDays, isoWeekday, monthKeys };
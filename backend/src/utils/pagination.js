'use strict';

function parsePagination(query, { defaultLimit = 10, maxLimit = 100 } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit);
  return { page, limit, offset: (page - 1) * limit };
}

const buildMeta = (page, limit, total, extra = {}) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
  ...extra,
});

// Escapes LIKE wildcards in user input (SQL Server style) and wraps it as %term%
const likeTerm = (text) => `%${String(text).replace(/[\[%_]/g, '[$&]')}%`;

module.exports = { parsePagination, buildMeta, likeTerm };
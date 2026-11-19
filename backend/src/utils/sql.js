'use strict';

// "Today" in the gym's timezone. Change 'India Standard Time' if the gym is elsewhere.
const TODAY = "CONVERT(date, SYSDATETIMEOFFSET() AT TIME ZONE 'India Standard Time')";

// DATE column -> 'YYYY-MM-DD'
const dateOut = (column) => `CONVERT(varchar(10), ${column}, 23)`;

// TIME column -> 'HH:mm'
const timeOut = (column) => `CONVERT(varchar(5), ${column}, 108)`;

// DATETIME2 column (stored in UTC) -> date in the gym's timezone
const localDate = (column) =>
  `CONVERT(date, ${column} AT TIME ZONE 'UTC' AT TIME ZONE 'India Standard Time')`;

/**
 * Builds "col = ?" pieces for an UPDATE from a whitelist map { jsField: 'sql_column' }.
 * Column names come from our own constants, never from user input.
 */
function buildUpdate(data, allowed) {
  const sets = [];
  const params = [];
  for (const [field, column] of Object.entries(allowed)) {
    if (data[field] !== undefined) {
      sets.push(`${column} = ?`);
      params.push(data[field]);
    }
  }
  return { sets, params };
}

module.exports = { TODAY, dateOut, timeOut, localDate, buildUpdate };
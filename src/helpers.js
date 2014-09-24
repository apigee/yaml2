// --- Helpers

/**
 * Return 'near "context"' where context
 * is replaced by a chunk of _str_.
 *
 * @param  {string} str
 * @return {string}
 * @api public
 */

function context(str) {
  if (typeof str !== 'string')
    return '';

  str = str
    .slice(0, 25)
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\\"');

  return 'near "' + str + '"';
}

/**
 * Return a UTC time from a time token
 *
 * @param {mixed} token
 * @return {Date}
 * @api public
*/

function parseTimestamp(token) {
  var date = new Date
  var year = token[2],
      month = token[3],
      day = token[4],
      hour = token[5] || 0,
      min = token[6] || 0,
      sec = token[7] || 0;

  date.setUTCFullYear(year, month-1, day);
  date.setUTCHours(hour);
  date.setUTCMinutes(min);
  date.setUTCSeconds(sec);
  date.setUTCMilliseconds(0);

  return date;
}


module.exports = {
  context: context,
  parseTimestamp: parseTimestamp
};

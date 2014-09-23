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
  if (typeof str !== 'string') return ''
  str = str
    .slice(0, 25)
    .replace(/\n/g, '\\n')
    .replace(/"/g, '\\\"')
  return 'near "' + str + '"'
}

module.exports = { context: context };

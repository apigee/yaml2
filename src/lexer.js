var helpers = require('./helpers');
// --- Lexer

/**
 * YAML grammar tokens.
 */

var tokens = [
  ['comment', /^#[^\n]*/],
  ['indent', /^\n( *)/],
  ['space', /^ +/],
  ['true', /^\b(enabled|true|yes|on)\b/],
  ['false', /^\b(disabled|false|no|off)\b/],
  ['null', /^\b(null|Null|NULL|~)\b/],
  ['string', /^"(.*?)"/],
  ['string', /^'(.*?)'/],
  ['timestamp', /^((\d{4})-(\d\d?)-(\d\d?)(?:(?:[ \t]+)(\d\d?):(\d\d)(?::(\d\d))?)?)/],
  ['float', /^(\d+\.\d+)/],
  ['int', /^(\d+)/],
  ['doc', /^---/],
  [',', /^,/],
  ['{', /^\{(?![^\n\}]*\}[^\n]*[^\s\n\}])/],
  ['}', /^\}/],
  ['[', /^\[(?![^\n\]]*\][^\n]*[^\s\n\]])/],
  [']', /^\]/],
  ['-', /^\-/],
  [':', /^[:]/],
  ['string', /^(?![^:\n\s]*:[^\/]{2})(([^:,\]\}\n\s]|(?!\n)\s(?!\s*?\n)|:\/\/|,(?=[^\n]*\s*[^\]\}\s\n]\s*\n)|[\]\}](?=[^\n]*\s*[^\]\}\s\n]\s*\n))*)(?=[,:\]\}\s\n]|$)/],
  ['id', /^([\w|\/|\$][\w -]*)/ ]
]


/**
 * Tokenize the given _str_.
 *
 * @param  {string} str
 * @return {array}
 * @api private
 */

exports.tokenize = function (str) {
  var token, captures, ignore, input,
      index = 0,
      indents = 0, lastIndents = 0,
      stack = [], indentAmount = -1

  // Windows new line support (CR+LF, \r\n)
  str = str.replace(/\r\n/g, "\n");

  while (str.length) {
    for (var i = 0, len = tokens.length; i < len; ++i)
      if (captures = tokens[i][1].exec(str)) {
        // token format: [tokenType, capturedToken, startIndex, endIndex]
        token = [tokens[i][0], captures, index, index + captures[0].length - 1];
        str = str.replace(tokens[i][1], '');
        index += captures[0].length;
        switch (token[0]) {
          case 'comment':
            ignore = true;
            break;
          case 'indent':
            lastIndents = indents;
            // determine the indentation amount from the first indent
            if (indentAmount == -1) {
              indentAmount = token[1][1].length;
            }

            indents = token[1][1].length / indentAmount;

            if (indents === lastIndents || isNaN(indents)) {
              ignore = true;
            }
            else if (indents > lastIndents + 1){
              throw new SyntaxError('invalid indentation, got ' + indents + ' instead of ' + (lastIndents + 1));
            }
            else if (indents < lastIndents) {
              input = token[1].input;
              token = ['dedent'];
              token.input = input;
              while (--lastIndents > indents){
                stack.push(token)
              }
            }
        }
        break
      }
    if (!ignore)
      if (token)
        stack.push(token),
        token = null
      else
        throw new SyntaxError(helpers.context(str))
    ignore = false
  }
  return stack
}

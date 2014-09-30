(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function assemble(ast) {
  var result;

  if (!ast) {
    return ast;
  }

  if (!ast.constructor || !ast.constructor.name) {
    return ast.value;
  }

  switch (ast.constructor.name){
    case 'String':
      result = ast;
      break;
    case 'YAMLDoc':
      result = assemble(ast.value);
      break;
    case 'YAMLHash':
      result = {};
      ast.keys.forEach(function (key){
        result[key.keyName] = assemble(key.value);
      });
      break;
    case 'YAMLList':
      result = [];
      ast.items.forEach(function (item){
        result.push(assemble(item));
      });
      break;
    default:
      result = ast.value;

  }

  return result;
}


module.exports = assemble;
},{}],2:[function(require,module,exports){
var helpers = require('./helpers');

// --- AST

/**
 * Initialize with _tokens_.
 */

function AST(tokens, str) {
  this.tokens = tokens;

  // Windows new line support (CR+LF, \r\n)
  str = str.replace(/\r\n/g, '\n');

  // Use a regex to do this magic
  this.lines = str.split(/\n/g).map(function(i){ return i + '\n'});
  this.strLength = str.length;
}

/**
 * Look-ahead a single token.
 *
 * @return {array}
 * @api public
 */

AST.prototype.peek = function() {
  return this.tokens[0]
}

/**
 * Advance by a single token.
 *
 * @return {array}
 * @api public
 */

AST.prototype.advance = function() {
  return this.tokens.shift()
}

/**
 * Advance and return the token's value.
 *
 * @return {mixed}
 * @api private
 */

AST.prototype.advanceValue = function() {
  return this.advance()[1][1]
}

/**
 * Accept _type_ and advance or do nothing.
 *
 * @param  {string} type
 * @return {bool}
 * @api private
 */

AST.prototype.accept = function(type) {
  if (this.peekType(type))
    return this.advance()
}

/**
 * Expect _type_ or throw an error _msg_.
 *
 * @param  {string} type
 * @param  {string} msg
 * @api private
 */

AST.prototype.expect = function(type, msg) {
  if (this.accept(type)) return
  throw new Error(msg + ', ' + helpers.context(this.peek()[1].input))
}

/**
 * Return the next token type.
 *
 * @return {string}
 * @api private
 */

AST.prototype.peekType = function(val) {
  return this.tokens[0] &&
         this.tokens[0][0] === val
}

/**
 * space*
 */

AST.prototype.ignoreSpace = function() {
  while (this.peekType('space'))
    this.advance()
}

/**
 * (space | indent | dedent)*
 */

AST.prototype.ignoreWhitespace = function() {
  while (this.peekType('space') ||
         this.peekType('indent') ||
         this.peekType('dedent'))
    this.advance()
}

// constructor functions
function YAMLDoc() {
  this.node = 'YAMLDoc';
}
function YAMLHash() {
  this.node = 'YAMLHash';
  this.keys = [];
}
function YAMLHashKey(id) {
  this.node = 'YAMLHashKey';
  this.keyName = id[1][0]
}
function YAMLList() {
  this.node = 'YAMLList';
  this.items = [];
}
function YAMLInt(token){
  this.node = 'YAMLInt';
  this.raw = token[1][0];
  this.value = parseInt(token[1][0]);
}
function YAMLFloat(token) {
  this.node = 'YAMLFloat';
  this.raw = token[1][0];
  this.value = parseFloat(token[1][0]);
}
function YAMLString(token) {
  var raw = token[1][0];

  this.raw = raw;
  this.node = 'YAMLString';

  if (raw[0] === raw[raw.length - 1] && (raw[0] === '"' || raw[0] === '\'')){
    // Remove quotation marks
    this.value = raw.substring(1, raw.length - 1);
  } else {
    this.value = token[1][0];
  }
}
function YAMLTrue(token) {
  this.node = 'YAMLTrue';
  this.raw = token[1][0];
  this.value = true
}
function YAMLFalse(token) {
  this.node = 'YAMLFalse';
  this.raw = token[1][0];
  this.value = false;
}
function YAMLNull(token) {
  this.node = 'YAMLNull';
  this.raw = token[1][0];
  this.value = null;
}
function YAMLDate(token) {
  this.node = 'YAMLDate';
  this.raw = token[1][0];
  this.value = helpers.parseTimestamp(token[1]);
}

AST.prototype.parse = function() {
  switch (this.peek()[0]) {
    case 'doc':
      return this.parseDoc();
    case '-':
      return this.parseList();
    case '{':
      return this.parseInlineHash();
    case '[':
      return this.parseInlineList();
    case 'id':
      return this.parseHash();
    case 'string':
      return this.parseValue(YAMLString);
    case 'timestamp':
      return this.parseValue(YAMLDate);
    case 'float':
      return this.parseValue(YAMLFloat);
    case 'int':
      return this.parseValue(YAMLInt);
    case 'true':
      return this.parseValue(YAMLTrue);
    case 'false':
      return this.parseValue(YAMLFalse);
    case 'null':
      return this.parseValue(YAMLNull);
  }
};

AST.prototype.parseDoc = function() {
  this.accept('doc');
  this.expect('indent', 'expected indent after document');
  var val = this.parse();
  this.expect('dedent', 'document not properly dedented');
  var yamlDoc = new YAMLDoc();
  yamlDoc.value = val;
  yamlDoc.start = this.indexToRowCol(0);
  yamlDoc.end = this.indexToRowCol(this.strLength - 1);
  return yamlDoc;
}

AST.prototype.parseHash = function() {
  var id, hash = new YAMLHash();
  while (this.peekType('id') && (id = this.advance())) {
    this.expect(':', 'expected semi-colon after id');
    this.ignoreSpace();
    var hashKey = new YAMLHashKey(id);
    this.assignStartEnd(hashKey, id);
    if (this.accept('indent')) {
      hashKey.value = this.parse();
      if (this.tokens.length){
        this.expect('dedent', 'hash not properly dedented');
      }
    } else {
      hashKey.value = this.parse();
    }
    hash.keys.push(hashKey);
    this.ignoreSpace();
  }

  // Add start and end to the hash based on start of the first key
  // and end of the last key
  hash.start = hash.keys[0].start;
  hash.end = hash.keys[hash.keys.length - 1].value.end;

  return hash;
}

AST.prototype.parseInlineHash = function() {
  var hash = new YAMLHash(), id, i = 0;
  this.accept('{');

  while (!this.accept('}')) {
    this.ignoreSpace();

    if (i) {
      this.expect(',', 'expected comma');
    }
    this.ignoreWhitespace();

    if (this.peekType('id') && (id = this.advance())) {
      var hashKey = new YAMLHashKey(id);
      this.assignStartEnd(hashKey, id);
      this.expect(':', 'expected semi-colon after id');
      this.ignoreSpace();
      hashKey.value = this.parse();
      hash.keys.push(hashKey);
      this.ignoreWhitespace();
    }
    ++i;
  }

  // Add start and end to the hash based on start of the first key
  // and end of the last key
  hash.start = hash.keys[0].start;
  hash.end = hash.keys[hash.keys.length - 1].value.end;

  return hash;
}

AST.prototype.parseList = function() {
  var list = new YAMLList();
  var begining, end;

  begining = this.accept('-');
  while (true) {
    this.ignoreSpace();

    if (this.accept('indent')) {
      list.items.push(this.parse());
      this.expect('dedent', 'list item not properly dedented');
    } else{
      list.items.push(this.parse());
    }

    this.ignoreSpace();

    end = this.accept('-');

    if (end){
      // Keep a copy of last end to use it for list.end
      endBuffer = end;
    } else {
      end = endBuffer;
      break;
    }
  }

  list.start = begining[2];
  list.end = end[3];

  return list;
}

AST.prototype.parseInlineList = function() {
  var list = new YAMLList(), i = 0;
  var begining = this.accept('[');
  var end = this.accept(']');

  while (!end) {
    this.ignoreSpace();
    if (i) this.expect(',', 'expected comma');
    this.ignoreSpace();
    list.items.push(this.parse());
    this.ignoreSpace();
    ++i;
    end = this.accept(']');
  }

  list.start = begining[2];
  list.end = end[3];

  return list
}

AST.prototype.parseValue = function(constructorFn) {
  var token = this.advance();
  var value = new constructorFn(token);
  this.assignStartEnd(value, token);
  return value;
}


AST.prototype.assignStartEnd = function (node, token) {
  node.start = this.indexToRowCol(token[2]);
  node.end = this.indexToRowCol(token[3]);
}

AST.prototype.indexToRowCol = function (index) {
  if (!this.lines) return null;

  for (var l = 0; l < this.lines.length; l++) {
    if (index >= this.lines[l].length){
      index -= this.lines[l].length;
    } else {
      break;
    }
  }

  return {
    row: l,
    column: index
  };
}

module.exports = AST;

},{"./helpers":3}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{"./helpers":3}],5:[function(require,module,exports){
// YAML - Core -
// Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)
// Copyright Mohsen Azimi <mohsen@mohsenweb.com> (MIT Licensed)

var assemble = require('./assembler');
var AST = require('./ast');
var tokenize = require('./lexer').tokenize;

/**
 * Version triplet.
 */

exports.version = '0.3.0';


/**
 * Evaluate a _str_ of yaml.
 *
 * @param  {string} str
 * @return {mixed}
 * @api public
 */

var eval = function(str) {
  return assemble(exports.ast(str));
}

/**
 * Evaluate a _str_ of yaml to an Abstract Syntax Tree (AST).
 *
 * @param  {string} str
 * @return {mixed}
 * @api public
 */
var ast = function(str) {
  return (new AST(tokenize(str), str)).parse()
}

if (typeof window !== 'undefined') {
  window.yaml2 = window.yaml2 || {
    eval: eval,
    ast: ast
  };
}

exports.eval = eval;
exports.ast = ast;
},{"./assembler":1,"./ast":2,"./lexer":4}]},{},[5]);

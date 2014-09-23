var Parser = require('./parser');

// --- AST

/**
 * Initialize with _tokens_.
 */

function AST(tokens) {
  this.tokens = tokens;
  this.lines = tokens[0][1].input.split('\n');
}

// Inherit from Parser
AST.prototype = Parser.prototype;

// constructor functions

function YAMLDoc() {}
function Hash() {
  this.keys = [];
}
function HashKey(id) {
  this.keyName = id[1][0]
}

function Int(token){
  this.value = parseInt(token[1][0]);
}

function List() {}
function TimeStamp() {}


AST.prototype.parse = function() {
  switch (this.peek()[0]) {
    case 'doc':
      return this.parseDoc()
    case '-':
      return this.parseList()
    case '{':
      return this.parseInlineHash()
    case '[':
      return this.parseInlineList()
    case 'id':
      return this.parseHash()
    case 'string':
      return this.advanceValue()
    case 'timestamp':
      return this.parseTimestamp()
    case 'float':
      return parseFloat(this.advanceValue())
    case 'int':
      return this.parseInt();
    case 'true':
      this.advanceValue(); return true
    case 'false':
      this.advanceValue(); return false
    case 'null':
      this.advanceValue(); return null
  }
}


/**
 * '---'? indent expr dedent
 */

AST.prototype.parseDoc = function() {
  this.accept('doc')
  this.expect('indent', 'expected indent after document')
  var val = this.parse()
  this.expect('dedent', 'document not properly dedented')
  var yamlDoc = new YAMLDoc();
  yamlDoc.value = val;
  return yamlDoc;
}

/**
 *  ( id ':' - expr -
 *  | id ':' - indent expr dedent
 *  )+
 */

AST.prototype.parseHash = function() {
  var id, hash = new Hash();
  while (this.peekType('id') && (id = this.advance())) {
    this.expect(':', 'expected semi-colon after id');
    this.ignoreSpace();
    var hashKey = new HashKey(id);
    hashKey.start = this.indexToRowCol(id[2]);
    hashKey.end = this.indexToRowCol(id[3]);
    if (this.accept('indent')) {
      hashKey.value = this.parse();
      this.expect('dedent', 'hash not properly dedented');
    } else {
      hashKey.value = this.parse();
    }
    hash.keys.push(hashKey);
    this.ignoreSpace();
  }
  return hash
}

/**
 * '{' (- ','? ws id ':' - expr ws)* '}'
 */

AST.prototype.parseInlineHash = function() {
  var hash = {}, id, i = 0
  this.accept('{')
  while (!this.accept('}')) {
    this.ignoreSpace()
    if (i) this.expect(',', 'expected comma')
    this.ignoreWhitespace()
    if (this.peekType('id') && (id = this.advanceValue())) {
      this.expect(':', 'expected semi-colon after id')
      this.ignoreSpace()
      hash[id] = this.parse()
      this.ignoreWhitespace()
    }
    ++i
  }
  return hash
}

/**
 *  ( '-' - expr -
 *  | '-' - indent expr dedent
 *  )+
 */

AST.prototype.parseList = function() {
  var list = []
  while (this.accept('-')) {
    this.ignoreSpace()
    if (this.accept('indent'))
      list.push(this.parse()),
      this.expect('dedent', 'list item not properly dedented')
    else
      list.push(this.parse())
    this.ignoreSpace()
  }
  return list
}

/**
 * '[' (- ','? - expr -)* ']'
 */

AST.prototype.parseInlineList = function() {
  var list = [], i = 0
  this.accept('[')
  while (!this.accept(']')) {
    this.ignoreSpace()
    if (i) this.expect(',', 'expected comma')
    this.ignoreSpace()
    list.push(this.parse())
    this.ignoreSpace()
    ++i
  }
  return list
}

/**
 * yyyy-mm-dd hh:mm:ss
 *
 * For full format: http://yaml.org/type/timestamp.html
 */

AST.prototype.parseTimestamp = function() {
  var token = this.advance()[1]
  var date = new Date
  var year = token[2]
    , month = token[3]
    , day = token[4]
    , hour = token[5] || 0
    , min = token[6] || 0
    , sec = token[7] || 0

  date.setUTCFullYear(year, month-1, day)
  date.setUTCHours(hour)
  date.setUTCMinutes(min)
  date.setUTCSeconds(sec)
  date.setUTCMilliseconds(0)
  return date
}

AST.prototype.parseInt = function () {
  var token = this.advance();
  var int = new Int(token);
  int.start = this.indexToRowCol(token[2]);
  int.end = this.indexToRowCol(token[3]);
  return int;
}


/*
 * Converts index to row,col object
*/
AST.prototype.indexToRowCol = function (index) {
  for (var l = 0; l < this.lines.length; l++) {
    if (index > this.lines[l].length){
      index -= this.lines[l].length;
    } else {
      return {
        row: l,
        column: index
      };
    }
  }
}

module.exports = AST;

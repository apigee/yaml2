var Parser = require('./parser');

// --- AST

/**
 * Initialize with _tokens_.
 */

function AST(tokens, str) {
  this.tokens = tokens;

  // Windows new line support (CR+LF, \r\n)
  str = str.replace(/\r\n/g, '\n');
  this.lines = str.split('\n');
  this.strLength = str.length;
}

// Inherit from Parser
AST.prototype = new Parser();

// constructor functions

function YAMLDoc() {}

function YAMLHash() {
  this.keys = [];
}
function YAMLHashKey(id) {
  this.keyName = id[1][0]
}

function YAMLList() {
  this.items = [];
}

function YAMLInt(token){
  this.value = parseInt(token[1][0]);
}
function YAMLFloat(token) {
  this.value = parseFloat(token[1][0]);
}
function YAMLString(token) {
  this.value = token[1][0];
}
function YAMLBoolean(token) {
  this.value = token[1][0];
}
function YAMLNull(token) {
  this.value = token[1][0];
}
function YAMLDate(token) {
  this.value = token[1][0];
}




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
      return this.parseValue(YAMLString);
    case 'timestamp':
      return this.parseValue(YAMLDate)
    case 'float':
      return this.parseValue(YAMLFloat)
    case 'int':
      return this.parseValue(YAMLInt);
    case 'true':
    case 'false':
      return this.parseValue(YAMLBoolean);
    case 'null':
      return this.parseValue(YAMLNull);
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
  yamlDoc.start = this.indexToRowCol(0);
  yamlDoc.end = this.indexToRowCol(this.strLength - 1);
  return yamlDoc;
}

/**
 *  ( id ':' - expr -
 *  | id ':' - indent expr dedent
 *  )+
 */

AST.prototype.parseHash = function() {
  var id, hash = new YAMLHash();
  while (this.peekType('id') && (id = this.advance())) {
    this.expect(':', 'expected semi-colon after id');
    this.ignoreSpace();
    var hashKey = new YAMLHashKey(id);
    this.assignStartEnd(hashKey, id);
    if (this.accept('indent')) {
      hashKey.value = this.parse();
      this.expect('dedent', 'hash not properly dedented');
    } else {
      hashKey.value = this.parse();
    }
    hash.keys.push(hashKey);
    this.ignoreSpace();
  }

  // Add start and end to the hash based on start of the first key
  // and end of the last key
  hash.start = hash.keys[0].start;
  hash.end = hash.keys[hash.keys.length - 1].end;

  return hash
}

/**
 * '{' (- ','? ws id ':' - expr ws)* '}'
 */

AST.prototype.parseInlineHash = function() {
  var hash = new YAMLHash(), id, i = 0
  this.accept('{')
  while (!this.accept('}')) {
    this.ignoreSpace()
    if (i) this.expect(',', 'expected comma')
    this.ignoreWhitespace()
    if (this.peekType('id') && (id = this.advanceValue())) {
      var hashKey = new YAMLHashKey(id);
      this.assignStartEnd(hashKey, id);
      this.expect(':', 'expected semi-colon after id')
      this.ignoreSpace()
      hashKey.value = this.parse();
      hash.keys.push(hashKey);
      this.ignoreWhitespace()
    }
    ++i
  }

  // Add start and end to the hash based on start of the first key
  // and end of the last key
  hash.start = hash.keys[0].start;
  hash.end = hash.keys[hash.keys.length - 1].end;

  return hash
}

/**
 *  ( '-' - expr -
 *  | '-' - indent expr dedent
 *  )+
 */

AST.prototype.parseList = function() {
  var list = new YAMLList();
  while (this.accept('-')) {
    this.ignoreSpace()
    if (this.accept('indent'))
      list.items(this.parse()),
      this.expect('dedent', 'list item not properly dedented')
    else
      list.items.push(this.parse())
    this.ignoreSpace()
  }

  // Add start and end to the list based on start of the first item
  // and end of the last item
  list.start = list.items[0].start;
  list.end = list.items[list.items.length - 1].end;

  return list
}

/**
 * '[' (- ','? - expr -)* ']'
 */

AST.prototype.parseInlineList = function() {
  var list = new YAMLList(), i = 0
  this.accept('[')
  while (!this.accept(']')) {
    this.ignoreSpace()
    if (i) this.expect(',', 'expected comma')
    this.ignoreSpace()
    list.items.push(this.parse())
    this.ignoreSpace()
    ++i
  }

  // Add start and end to the list based on start of the first item
  // and end of the last item
  list.start = list.items[0].start;
  list.end = list.items[list.items.length - 1].end;

  return list
}

/**
 *
 * use the constructor function t
 */

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

/*
 * Converts index to row,col object
*/
AST.prototype.indexToRowCol = function (index) {
  if (!this.lines) return null;

  for (var l = 0; l < this.lines.length; l++) {
    if (index > this.lines[l].length){
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

var Parser = require('./parser');
var helpers = require('./helpers');

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

// Inherits from Parser
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
  this.raw = token[1][0];
  this.value = parseInt(token[1][0]);
}
function YAMLFloat(token) {
  this.raw = token[1][0];
  this.value = parseFloat(token[1][0]);
}
function YAMLString(token) {
  this.raw = token[1][0];
  this.value = token[1][0];
}
function YAMLBoolean(token) {
  this.raw = token[1][0];
  this.value = token[1][0];
}
function YAMLNull(token) {
  this.raw = token[1][0];
  this.value = null;
}
function YAMLDate(token) {
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
    case 'false':
      return this.parseValue(YAMLBoolean);
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

    if (this.peekType('id') && (id = this.advanceValue())) {
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

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
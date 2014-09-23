// YAML - Core - Copyright TJ Holowaychuk <tj@vision-media.ca> (MIT Licensed)

var Parser = require('./parser');
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

exports.eval = function(str) {
  return (new Parser(tokenize(str))).parse()
}

/**
 * Evaluate a _str_ of yaml to an Abstract Syntax Tree (AST).
 *
 * @param  {string} str
 * @return {mixed}
 * @api public
 */
exports.ast = function(str) {
  return (new AST(tokenize(str))).parse()
}

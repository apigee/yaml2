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
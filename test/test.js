var fs = require('fs');
var path = require('path');
var  yaml = require('../lib/yaml');

require('chai').should();

[
  'boolean',
  'comment',
  'config',
  'dates',
  'hash',
  'list',
  'list.nested',
  'mini',
  'null'
].forEach(function (fileName){
  describe(fileName, function () {
    var y = fs.readFileSync( path.join(__dirname, fileName+'.yaml'));
    y = y.toString();

    it('should output correct AST', function () {
      var ast = fs.readFileSync( path.join(__dirname,
        'results/ast/'+fileName+'.yaml.json') );
      ast = ast.toString();
      ast = JSON.parse(ast);

      var result = yaml.ast(y);
      // return fs.writeFileSync( path.join(__dirname, 'results/ast/'+fileName+'.yaml.json'),
      //   JSON.stringify(result, null, 2));
      result = JSON.parse(JSON.stringify(result));
      result.should.deep.equal(ast);
    });

    it('should output correct parsed value', function () {
      var parsed = fs.readFileSync( path.join(__dirname,
        'results/parsed/'+fileName+'.yaml.json') );
      parsed = parsed.toString();
      parsed = JSON.parse(parsed);

      var result = yaml.eval(y);
      result = JSON.parse(JSON.stringify(result));
      result.should.deep.equal(parsed);;
    });
  });
});
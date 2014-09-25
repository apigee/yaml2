
var fs = require('fs');
var path = require('path');
var  yaml = require('../lib/yaml');
var util = require('util');

if (process.argv[2]) {
  return run(process.argv[2]);
}

fs.readdir(__dirname, function (err, files) {
  files.forEach(function (file) {
    if(file.indexOf('yaml') > -1){
      run(path.join(__dirname, file))
    }
  });
});

function run(filePath){
  fs.readFile(filePath, function(err, fileContents) {
    fileContents = fileContents.toString()
    console.log('\n')
    console.log(fileContents)
    console.log('\nparse outputs:\n')
    var parsed = yaml.eval(fileContents);
    console.log(util.inspect(parsed, {showHidden: false, depth: null}));
    console.log('\n')
    console.log('\nast outputs:\n')
    var asted = yaml.ast(fileContents);
    console.log(util.inspect(asted, {showHidden: false, depth: null}));
  });
}
require('colors');
var fs = require('fs');
var path = require('path');
var  yaml = require('../lib/yaml');

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
  var fileName = filePath.split('/');
  fileName = fileName[fileName.length - 1];

  fs.readFile(filePath, function(err, fileContents) {
    fileContents = fileContents.toString();
    console.log(fileContents);
    var parsed = yaml.eval(fileContents);
    console.assert(parsed, fs.readFileSync('./examples/results/parsed/' + fileName + '.json').toString() ===
      JSON.stringify(parsed, null, 2), 'did not pass!');
    var asted = yaml.ast(fileContents);
    console.assert(asted, fs.readFileSync('./examples/results/parsed/' + fileName + '.json').toString() ===
      JSON.stringify(asted, null, 2), 'did not pass!');
    console.log('passed\n'.green);
  });
}
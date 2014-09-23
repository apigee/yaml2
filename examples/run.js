
var fs = require('fs');
var path = require('path');
var  yaml = require('../lib/yaml');

fs.readdir(__dirname, function (err, files) {
  files.forEach(function (file) {
    if(file.indexOf('yaml')){
      fs.readFile(path.join(__dirname, file), function(err, fileContents) {
        fileContents = fileContents.toString()
        console.log('\n')
        console.log(fileContents)
        console.log('\nparse outputs:\n')
        console.log(yaml.eval(fileContents))
        console.log('\n')
        console.log('\nast outputs:\n')
        console.log(yaml.ast(fileContents))
      });
    }
  });
});


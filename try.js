var jsyaml = require('./lib/yaml.js');


var yaml = 'me: 1';

var result = jsyaml.ast(yaml);
console.log(result.constructor.name)
console.log(result);


# YAML2
<a href='https://travis-ci.org/apigee/yaml2'><img src='https://travis-ci.org/apigee/yaml2.svg'/></a>

YAML2 is a fork of [JS-YAML](https://github.com/visionmedia/js-yaml) which adds functionality to get an abstract syntax tree out of a YAML string.

CommonJS JavaScript YAML parser, fast and tiny. Although this implementation
does not currently support the entire YAML specification, feel free to
fork the project and submit a patch :) 

# Usage


#### Get JavaScript object out of a YAML string
    require('yaml2').eval(string_of_yaml)
#### Get Abstract Syntax Tree(AST) out of a YAML string
    require('yaml2').ast(string_of_yaml)
    
# Currently Supports

  * Comments
  * Sequences (arrays)
  * Maps (hashes)
  * Inline sequences
  * Inline maps
  * Nesting
  * Primitive scalars (integers, floats, booleans, etc)
  * Extended bools (enabled, disabled, yes, no, on, off, true, false)
  
## Installation


### Via NPM
    $ npm install yaml2

### Via Bower
    $ bower install yaml_2
    
# Testing

Run:

    $ npm test

### Known bugs and missing features

  * Inline commnets: `key: value # this is value`
  * Inline hash with key quoted: `hash: {"me": 1}`

# License 

(The MIT License)

Copyright (c) 2009 TJ Holowaychuk <tj@vision-media.ca>

Copyright (c) 2014 Mohsen Azimi(Apigee) <mazimi@apigee.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

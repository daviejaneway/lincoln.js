var lincoln = require('../lincoln.js');
var assert = require('assert');

(function test_parse_fails_without_semicolon() {
  var tokens = lincoln.tokenise('select * from test');
  
  assert.throws(function() {lincoln.parse(tokens)});
}());

(function test_parse_select_star_from_test() {
  var tokens = lincoln.tokenise('select * from test;');
  var output = lincoln.parse(tokens);
  
  var expected = {select: {
    fields: ['*'],
    from:   {type:'id', value:'test'}
  }};
  
  assert.deepEqual(output, expected);
}());

(function test_parse_select_multiple_columns_from_test() {
  var tokens = lincoln.tokenise('select a, b, c from test;');
  var output = lincoln.parse(tokens);
  
  var expected = {select: {
      fields: ['a', 'b', 'c'],
      from: {type:'id', value:'test'}
  }};
  
  assert.deepEqual(output, expected);
}());

(function test_parse_simple_expression() {
  var tokens = lincoln.tokenise('a = 1;');
  var output = lincoln.parseExpression(tokens);
  
  var expected = {
    lval: {type:'id', value:'a'},
    rel:  {type:'rel', value:'='},
    rval: {type:'id', value:'1'}
  };
  
  assert.deepEqual(output, expected);
}());

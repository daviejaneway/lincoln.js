var lincoln = require('../lincoln.js');
var assert  = require('assert');

lincoln.__debug__ = true;

(function test_tokens_invalid__without_semicolon() {
  var tokens = lincoln.tokenise('select * from test');
  
  // With a semi-colon, we would get back 4 tokens;
  assert.ok(tokens.length !== 4);
}());

(function test_tokenise_select() {
  var tokens = lincoln.tokenise('select;');
  
  assert.ok(tokens.length === 1);
  assert.ok(tokens[0].type === 'reserved');
  assert.ok(tokens[0].value === 'select');
}());

(function test_tokenise_from() {
  var tokens = lincoln.tokenise('from;');
  
  assert.ok(tokens.length === 1);
  assert.ok(tokens[0].type === 'reserved');
  assert.ok(tokens[0].value === 'from');
}());

(function test_tokenise_single_column_list() {
  var tokens_a = lincoln.tokenise('column_a;');
  var tokens_b = lincoln.tokenise('someOtherColumn;');
  var tokens_c = lincoln.tokenise('*;');
  
  assert.ok(tokens_a.length === 1);
  assert.ok(tokens_b.length === 1);
  assert.ok(tokens_c.length === 1);
  
  assert.ok(tokens_a[0].type === 'id');
  assert.ok(tokens_b[0].type === 'id');
  assert.ok(tokens_c[0].type === 'id');    
}());

(function test_tokenise_multiple_columns_list(){
  var tokens = lincoln.tokenise('select a, b, c from test;').reverse();
      
  assert.ok(tokens.length === 8);
  
  assert.ok(tokens[1].type === 'id');
  assert.ok(tokens[1].value === 'a');
  
  assert.ok(tokens[3].type === 'id');
  assert.ok(tokens[3].value === 'b');
  
  assert.ok(tokens[5].type === 'id');
  assert.ok(tokens[5].value === 'c');

}());

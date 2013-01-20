var lincoln = require('../lincoln.js');
var assert = require('assert');

(function test_parse_fails_without_semicolon() {
  var tokens = lincoln.tokenise('select * from test');
  
  assert.throws(function() {lincoln.parse(tokens)});
}());

(function test_parse_select_star_from_test() {
  var tokens = lincoln.tokenise('select * from test;');
  var output = lincoln.parse(tokens);
  
  var expected = {
    statements:[]
  };
  
  expected.statements.push({
    type:'select',
    statement: {
      fields: [{type:'id', value:'*'}],
      from:   {type:'id', value:'test'},
      where:[]
  }});
  
  assert.deepEqual(output, expected);
}());

(function test_parse_select_multiple_columns_from_test() {
  var tokens = lincoln.tokenise('select a, b, c from test;');
  var output = lincoln.parse(tokens);
  
  var expected = {
    statements: []
  };
  
  expected.statements.push({
    type:'select',
    statement: {
      fields: [{type:'id', value:'a'}, {type:'id', value:'b'}, {type:'id', value:'c'}],
      from: {type:'id', value:'test'},
      where:[]
  }});
  
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

(function test_parse_string_compare_expression() {
  var tokens = lincoln.tokenise("a = 'Hello, World!';");
  var output = lincoln.parseExpression(tokens);
  
  var expected = {
    lval: {type:'id', value:'a'},
    rel:  {type:'rel', value:'='},
    rval: {type:'literal', value:'Hello, World!'}
  };
  
  assert.deepEqual(output, expected);
}());

(function test_single_clause_where() {
  var tokens = lincoln.tokenise("select * from test where a = 1;");
  var output = lincoln.parse(tokens);
  
  var expected = {
    statements: [{
        type:'select',
        statement: {
          fields: [{type:'id', value:'*'}],
          from:   {type:'id', value:'test'},
          where:  [{
            type: 'clause',
            expression: {
              lval: {type:'id', value:'a'},
              rel:  {type:'rel', value:'='},
              rval: {type:'id', value:'1'}
            }
          }]
        }
      }
    ]
  };
    
  assert.deepEqual(output, expected);
}());

(function test_parse_single_where_clause() {
  var tokens = lincoln.tokenise('select * from test where a = 1;');
  var output = lincoln.parse(tokens);
    
  var expected = [{
    type: 'clause',
    expression: {
      lval: {type:'id', value:'a'},
      rel:  {type:'rel', value:'='},
      rval: {type:'id', value:'1'}
    }
  }];
    
  assert.deepEqual(output.statements[0].statement.where, expected);
}());


"use strict";

(function(exports) {

/** SQL keywords */
var reserved  = ['select', 'from', 'where', 'order', 'group', 'by', 'limit', 'and', 'or', 'like', 'null', 'explain'];
/** Relationship operators */
var relations = ['=', '!=', '>', '<', '>=', '<=', 'is', 'not'];

/** debugging flag */
var __debug__ = true;

/**
 * Jump out at the first malformed token,
 * printing a useful error message.
 *
 * @param msg - a concise, succinct error message
 */
function error(msg) {
  throw msg;
}

function tokeniseString(input, tokens, pos) {
  var i = pos;

  var ch = '', buffer = '';
  while(ch = input[pos], ch !== undefined) {
    if(ch === "'") {
      tokens.push({type:'literal', value:buffer});            
      return (pos + 1);
    } else if(ch === '\\') {
      var esc = input[pos+1];
      
      switch(esc) {
        case 't': buffer += '\t'; pos++; break;
        case 's': buffer += ' '; pos++; break;
        default : error("Syntax Error: Unsupported escape sequence '\\" + esc + "'");
      }
    } else {
      buffer += ch;
    }
    
    pos++;
  }
  
  error('Parse Error: Unclosed string literal at ' + input + '[' + i + ']');
}

/**
 * Lex the input stream into a set of tokens
 * and report any malformed expressions.
 * 
 * @param input - the (sql statement)+ to parse
 */
exports.tokenise = function(input) {
  var tokens = [];

  var ch = '', buffer = '';
  for(var i = 0; i < input.length; i++) {
    ch = input[i];
    
    if(ch === "'") {
      buffer = '';
      i = tokeniseString(input, tokens, ++i);
      continue;
    } else if(ch === ' ' || ch === ';') {
      // We gots us a token, store it & clear the buffer.
      if(reserved.indexOf(buffer) > -1) {
        tokens.push({type:'reserved', value:buffer});
      } else if(relations.indexOf(buffer) > -1) {
        tokens.push({type:'rel', value:buffer});
      } else if(buffer.length > 0) {
        tokens.push({type:'id', value:buffer});
      }

      buffer = '';
    } else if(ch === ',') {
      if(buffer.length > 0) {
        tokens.push({type:'id', value:buffer});
      }
      tokens.push({type:'id', value:','});
      buffer = '';
    } else {
      // append to the buffer
      buffer += ch.toString();
    }
  }
  
  return tokens.reverse();
}

/**
 * Gets the list of columns to retrieve from
 * the query  or all columns if token is '*'.
 *
 * @param tokens - list of token objects to parse
 */
exports.parseFields = function(tokens) {
  var ast = [];
  var field;
  while(field = tokens.pop(), field.type === 'id') {
    if(field.value === ',') {
      continue;
    }
        
    ast.push(field);
  }
    
  tokens.push(field);
  
  return ast;
}

exports.parseLiteral = function(tokens) {
  var literal = tokens.pop();
  
  if(literal === undefined || literal === 'undefined') {
    error("Syntax Error: expected one of 'and', 'or' or expression (e.g a = 1, b = 'Hello, World!')");
  }
  
  if(literal.value == 'and') {
    literal = exports.parseLiteral(tokens);
  }
  
  if(literal.type === 'id' || literal.type === 'literal') {
    return literal;
  } else {
    tokens.push(literal);
    return null;
  }
    
  error('Parse Error: expected column name or literal, found ' + literal.value);
}

exports.parseRelationship = function(tokens) {
  var rel = tokens.pop();
  
  if(rel.type !== 'rel') {
    error('Parse Error: expected relationship operator, found ' + rel.value);
  }
  
  return rel;
}

exports.parseFrom = function(tokens) {
  var from = tokens.pop();
  
  if(from.value !== 'from') {
    error('Parse Error: expected \'from\', found ' + from.value);
  }
  
  var table = exports.parseLiteral(tokens);  
  
  return table;
}

exports.parseExpression = function(tokens) {
  if(tokens.length === 0) {
    return {};
  }
  
  var ast = {
    lval: {},
    rel: {},
    rval: {}
  };
  
  var lval = exports.parseLiteral(tokens);  
  
  if(lval === null) {
    return null;
  }
  
  var rel  = exports.parseRelationship(tokens);
  var rval = exports.parseLiteral(tokens);
  
  ast.lval = lval;
  ast.rel  = rel;
  ast.rval = rval;
  
  return ast;
}

exports.parseClause = function(tokens) {
  if(tokens.length === 0) {
    return {};
  }
  
  var ast = {
    type: 'clause',
    expression:{}
  };
  
  var expression = exports.parseExpression(tokens);
  
  if(expression === null) {
    return null;
  }
  
  ast.expression = expression;
  
  return ast;
}

exports.parseWhere = function(tokens) {
  var token;
  if(token = tokens.pop(), token.value !== 'where') {
    tokens.push(token);
  }

  var ast = [];
    
  var clause;
  while(clause = exports.parseClause(tokens), clause !== null && clause.type === 'clause') {
    if(clause.type !== 'clause') {
      error('Parse Error: expected expression, found ' + clause.expression);
    }
        
    ast.push(clause);
  }
  
  return ast;
}

exports.parseSelect = function(tokens, explain) {
  var ast = {
    type: 'select',
    statement: {
      fields:[],
      from:{},
      where:[],
      explain: (explain === undefined || explain === 'undefined') ? false : explain
    }
  };
  
  ast.statement.fields = exports.parseFields(tokens);
  ast.statement.from = exports.parseFrom(tokens);
  
  if(tokens.length > 0) {
    ast.statement.where = exports.parseWhere(tokens);
  }
  
  return ast;
}

exports.parseExplain = function(tokens) {
  tokens.pop();
  return exports.parseSelect(tokens, true);
}

exports.parse = function(tokens) {
  if(tokens.length === 0) {
    return false;
  }
  
  var ast = {
    statements:[]
  };
    
  var head;
  while(head = tokens.pop(), tokens.length > 0) {
    switch(head.value) {
      case 'explain': ast.statements.push(exports.parseExplain(tokens)); break;
      case 'select' : ast.statements.push(exports.parseSelect(tokens)); break;
      default: error('Parse Error: unexpected ' + head.value + '');
    }
  }
  
  return ast;
}

function generateWhere(node) {
  var where = {};
  
  var clause;
  for(var i in node) {
    clause = node[i];
    
    var field = clause.expression.lval.value;
    var value = clause.expression.rval.value;
    var rel   = clause.expression.rel.value;
    
    if(value.match(/[0-9]+(.[0-9]+)?/)) {
      value = parseInt(value);
    }
        
    switch(rel) {
      case '=' : where[field] = value; break;
      case '!=': where[field] = {'$ne': value}; break;
      case '>' : where[field] = {'$gt': value}; break;
      default: error('Compilation Error: unsupported operator ' + rel);
    }
  }
    
  return where;
}

function generateFind(node) {
  return function() {
    var fields = node.statement.fields;
    var collection = node.statement.from.value;
    var where = generateWhere(node.statement.where);
    var explain = node.statement.explain;
    
    if(fields.length === 1 && fields[0].value === '*') {
      return (explain) ? db[collection].find(where).explain() : db[collection].find(where);
    } else {
      var projection = {};
      for(var i in fields) {
        projection[fields[i].value] = 1;
      }
            
      return (explain) ? db[collection].find(where, projection).explain() : db[collection].find(where, projection);
    }
  }
}



exports.translate = function(ast) {
  var mongo_queries = [];
  
  for(var stmt in ast.statements) {
    switch(ast.statements[stmt].type) {
      case 'select': mongo_queries.push(generateFind(ast.statements[stmt])); break;
    }
  }
  
  return (mongo_queries.length === 1) ? mongo_queries[0] : mongo_queries;
}


exports.sql_to_mongo = function(query) {
  return exports.translate(exports.parse(exports.tokenise(query)));
}

}(typeof exports === 'undefined'
  ? (this.lincoln = {})
  : exports));

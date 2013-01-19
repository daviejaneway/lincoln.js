"use strict";

(function(exports) {

/** SQL keywords */
var reserved  = ['select', 'from', 'where', 'order', 'group', 'by', 'limit', 'and', 'or', 'like', 'null'];
/** Relationship operators */
var relations = ['=', '!=', '>', '<', '>=', '<=', 'is', 'not'];

/** debugging flag */
exports.__debug__ = false;

/**
 * Jump out at the first malformed token,
 * printing a useful error message.
 *
 * @param msg - a concise, succinct error message
 */
function error(msg) {
  if(!__debug__) {
    print(msg);
    throw null;
  }
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
  for(i in input) {
    ch = input[i];
    
    if(ch === ' ' || ch === ';') {
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
function parseFields(tokens) {
  var ast = [];
  var field;
  while(field = tokens.pop(), field.type === 'id') {
    if(field.value === ',') {
      continue;
    }
        
    ast.push(field.value);
  }
    
  tokens.push(field);
  
  return ast;
}

function parseLiteral(tokens) {
  var literal = tokens.pop();
  
  if(literal.type !== 'id') {
    error('Parse Error: expected column name or literal, found ' + literal.value);
  }
  
  return literal;
}

function parseRelationship(tokens) {
  var rel = tokens.pop();
  
  if(rel.type !== 'rel') {
    error('Parse Error: expected relationship operator, found ' + rel.value);
  }
  
  return rel;
}

function parseFrom(tokens) {
  var from = tokens.pop();
  
  if(from.value !== 'from') {
    error('Parse Error: expected \'from\', found ' + from.value);
  }
  
  from = tokens.pop();
  
  if(from.type !== 'id') {
    error('Parse Error: expected table identifier, found ' + from.value);
  }
  
  return from.value;
}

function parseExpression(tokens) {
  var ast = {
    lval: {},
    rel: {},
    rval: {}
  };
  
  var lval = parseIdentifier();  
  var rel  = parseRelationship();
  var rval = parseIdentifier();
  
  ast.lval = lval;
  ast.rel  = rel;
  ast.rval = rval;
  
  return ast;
}

function parseClause(tokens) {
  var ast = {
    left: {},
    right: {},
    rel: {}
  };
  
  ast.left  = parseExpression(tokens);
  ast.rel   = parseRelationship(tokens);
  ast.right = parseExpression(tokens);
}

function parseWhere(tokens) {
  var ast = {
    where: {
      clauses:[]
    }
  };
  
  var clause;
  while(clause = tokens.pop(), clause.value === 'and') {
    if(clause.type !== 'id') {
      error('Parse Error: expected expression, found ' + clause.value);
    }
    
    ast.where.clauses.push(parseClause(tokens));
  }
}

function parseSelect(tokens) {
  var ast = {
    select: {
      fields:[],
      from:''
    }
  };
  
  ast.select.fields = parseFields(tokens);
  ast.select.from = parseFrom(tokens);
  
  return ast;
}

function parse(tokens) {
  if(tokens.length === 0) {
    return false;
  }
  
  var head;
  while(head = tokens.pop(), tokens.length > 0) {
    switch(head.value) {
      case 'select': return parseSelect(tokens);
      case 'where':  return parseWhere(tokens);
      default: error('Parse Error: unexpected ' + head.value + '');
    }
  }
}

function generateFind(node) {
  return function() {
    var fields = node.fields;
    var collection = node.from;
    
    if(fields.length === 1 && fields[0] === '*') {
      return db[collection].find();
    } else {
      var projection = {};
      for(var i in fields) {
        projection[fields[i]] = 1;
      }
      
      return db[collection].find({}, projection);
    }
  }
}

function translate(ast) {
  if(ast['select'] !== null) {
    return generateFind(ast['select']);
  }
}


function sql_to_mongo(query) {
  return translate(parse(tokenise(query)));
}
}(typeof exports === 'undefined'
  ? (this.lincoln = {})
  : exports));

var TEST = false;

var reserved = ['select', 'from', 'where', '=', '>', '<', '>=', '<=', '!=', 'order', 'group', 'by', 'limit']


/**
 * Lex the input stream into a set of tokens
 * and report any malformed expressions.
 * 
 * @arg input
 */
function tokenise(input) {
  var tokens = [];

  var ch = '', buffer = '';
  for(i in input) {
    ch = input[i];
    
    if(ch === ' ' || ch === ';') {
      // We gots us a token, store it & clear the buffer.
      if(reserved.indexOf(buffer) > -1) {
        tokens.push({type:'reserved', value:buffer});
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

function parseFrom(tokens) {
  var from = tokens.pop();
  
  if(from.value !== 'from') {
    print('Parse Error: expected \'from\', found ' + from.value);
    throw null;
  }
  
  from = tokens.pop();
  
  if(from.type !== 'id') {
    print('Parse Error: expected table identifier, found ' + from.value);
    throw null;
  }
  
  return from.value;
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
  
  var head = tokens.pop();
    
  switch(head.value) {
    case 'select': return parseSelect(tokens);
    default: print('Parse Error: unexpected ' + head.value + ''); throw null;
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

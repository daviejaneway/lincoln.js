var lincoln = require('./lincoln.js');

lincoln.__debug__ = true;

(function test_tokenise_select() {
  var tokens = lincoln.tokenise('select;');
  console.log(tokens);
}());

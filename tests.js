exports. __test__ = function(assertion) {  
  this.assert = function() {
    if(eval(assertion) === false) {
      console.log('Assertion failed - ' + assertion);
      throw null;
    }
  }
}

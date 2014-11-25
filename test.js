var test = require('tape');
var drop = require('drag-and-drop-files');
var concat = require('concat-stream');
var frs = require('./');

drop(document.body, function(files) {
  var first = files[0], 
      s = frs(first),
      cursor, paused

  test('should read file when one is dropped', function(t) {
    s.pipe(concat(function(contents) {        
        t.equal(contents.length, first.size)
        t.equal(s.offset, first.size)
        t.end()
    }))
  })  

})

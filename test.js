var test = require('tape');
var drop = require('drag-and-drop-files');
var concat = require('concat-stream');
var frs = require('./');

test('should read file when one is dropped', function(t) {
  drop(document.body, function(files) {
    var first = files[0]
    frs(first).pipe(concat(function(contents) {
      t.true(contents.length > 0)
      t.end()
    }))
  })
})

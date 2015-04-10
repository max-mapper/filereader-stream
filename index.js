var inherits = require('inherits');
var toBuffer = require('typedarray-to-buffer');
var Readable = require('stream').Readable;
  
function FileStream(file, options) {
  if (!(this instanceof FileStream))
    return new FileStream(file, options);
    
  var self = this;
  Readable.call(this);
      
  this.file = file;
  this.options = options || {};
  this.chunkSize = this.options.chunkSize || 16384;
  this.offset = 0;
  
  var tags = ['name', 'size', 'type', 'lastModifiedDate'];
  tags.forEach(function (thing) {
    this[thing] = file[thing];
  }, this);
  
  if (typeof FileReader !== 'undefined') {
    this.async = true;
    this.reader = new FileReader();
    this.reader.onload = function() {
      self._emitChunk(self.reader.result);
    };
  } else if (typeof FileReaderSync !== 'undefined') {
    // web workers in Firefox don't support async FileReader, so use FileReaderSync
    this.async = false;
    this.reader = new FileReaderSync();
  } else {
    throw new Error('No filereader support');
  }
}

inherits(FileStream, Readable);

FileStream.prototype._read = function(bytes) {
  if (this.offset >= this.size) return;
  
  var blob = this.file.slice(this.offset, this.offset + this.chunkSize);
  if (this.async) {
    this.reader.readAsArrayBuffer(blob);
  } else {
    this._emitChunk(this.reader.readAsArrayBuffer(blob));
  }
};

FileStream.prototype._emitChunk = function(chunk) {
  var buf = toBuffer(new Uint8Array(chunk));
  this.offset += buf.length;
  this.push(buf);
  
  if (this.offset === this.size)
    this.push(null);
};

module.exports = FileStream;

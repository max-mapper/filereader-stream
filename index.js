module.exports = FileStream;

function FileStream(file, options) {
  if (!(this instanceof FileStream))
    return new FileStream(file, options);
  options = options || {};
  options.output = options.output || 'arraybuffer';
  this.options = options;
  this._file = file;
  this.readable = true;
  this.offset = 0;
  this.chunkSize = this.options.chunkSize || 8128;
  ['name',
   'size',
   'type',
   'lastModifiedDate'].forEach(function (thing) {
     this[thing] = file[thing];
   }, this);
};

FileStream.prototype.readChunk = function(outputType) {
  var end = this.offset + this.chunkSize;
  var slice = this._file.slice(this.offset, end);
  this.offset = end;
  if (outputType === 'binary')
    this.reader.readAsBinaryString(slice);
  else if (outputType === 'dataurl')
    this.reader.readAsDataURL(slice);
  else if (outputType === 'arraybuffer')
    this.reader.readAsArrayBuffer(slice);
  else if (outputType === 'text')
    this.reader.readAsText(slice);
}

FileStream.prototype.pipe = function pipe(dest, options) {
  var self = this;
  const outputType = this.options.output;
  this.reader = new FileReader();
  this.reader.onloadend = function loaded(event) {
    var data = event.target.result;
    if (data instanceof ArrayBuffer)
      data = new Buffer(new Uint8Array(event.target.result));
    dest.write(data);
    if (self.offset < self._file.size) {
      self.readChunk(outputType)
      return;
    }
    if (dest !== console && (!options || options.end !== false)) {
      if (dest.end)
        dest.end();
      if (dest.close)
        dest.close();
    }
  };
  self.readChunk(outputType);
  return dest;
};

var inherits = require('inherits')
var EventEmitter = require('events').EventEmitter

module.exports = FileStream

function FileStream(file, options) { 
  if (!(this instanceof FileStream))
    return new FileStream(file, options)
  options = options || {}
  options.output = options.output || 'arraybuffer'
  this.options = options
  this._file = file
  this.readable = true
  this.offset = options.offset || 0
  this.progressiv = options.progressiv || 200
  this.paused = false
  this.chunkSize = this.options.chunkSize || 8128
  this.speedOffset = 0

  var tags = ['name','size','type','lastModifiedDate','fullPath']
  tags.forEach(function (thing) {
     this[thing] = file[thing]
   }, this)      
}

  
FileStream.prototype._FileReader = function() {
  var self = this
  var reader = new FileReader()
  const outputType = this.options.output  

  reader.onloadend = function loaded(event) {
    var data = event.target.result      
    if (data instanceof ArrayBuffer)
      data = new Buffer(new Uint8Array(event.target.result))
    self.dest.write(data)        
    if (self.offset < self._file.size) {
      self.emit('offset', self.offset)
      !self.paused && self.readChunk(outputType)      
      return
    }
    self._end()
  }
  reader.onerror = function(e) {
    self.emit('error', e.target.error)
  }
  this.startIntervals()
  return reader
}

FileStream.prototype.readChunk = function(outputType) {
  var end = this.offset + this.chunkSize
  var slice = this._file.slice(this.offset, end)
  this.offset = end
  if (outputType === 'binary')
    this.reader.readAsBinaryString(slice)
  else if (outputType === 'dataurl')
    this.reader.readAsDataURL(slice)
  else if (outputType === 'arraybuffer')
    this.reader.readAsArrayBuffer(slice)
  else if (outputType === 'text')
    this.reader.readAsText(slice)  
}

FileStream.prototype.startIntervals = function() {
  var self = this

  this.progressInterval = setInterval(function(){
    self.emit('progress', self.offset)
  },this.progressiv)  

  this.speedInterval = setInterval(function(){    
    self.emit('speed', self.offset - self.speedOffset)
    self.speedOffset = self.offset
  },1000) // 1 second

}

FileStream.prototype.clearIntervals = function() {
    this.speedInterval && clearInterval(this.speedInterval)
    this.progressInterval && clearInterval(this.progressInterval)
}


FileStream.prototype._end = function() {
  if (this.dest !== console && (!this.options || this.options.end !== false)) {
    this.dest.end && this.dest.end()
    this.dest.close && this.dest.close()
    this.emit('end', this._file.size)
    this.clearIntervals()
  }  
}

FileStream.prototype.pipe = function pipe(dest, options) {
  this.reader = this._FileReader()
  this.readChunk(this.options.output)
  this.dest = dest  
  return dest
}

FileStream.prototype.pause = function() {
  this.paused = true
  this.clearIntervals()
  this.emit('pause', this.offset)
}

FileStream.prototype.resume = function() {
  this.paused = false
  this.startIntervals()
  this.readChunk(this.options.output)
  this.emit('resume', this.offset)
}

FileStream.prototype.abort = function() {
  this.paused = true
  this.reader.abort()
  self.emit('abort', this.offset)
  this._end()  
}

inherits(FileStream, EventEmitter)
var pako = require('pako');
var fs = require('fs');
var path = require('path');
var glob = require('glob');

var blockSize = 230000;
var searchPath = path.join(__dirname, '../dist/app');
var dir = `${searchPath}/compressed`;

function splitCompression(compressed, file) {
  var floored = Math.floor(compressed.length / blockSize);
  var blocks = Math.ceil(compressed.length / blockSize);
  var lastBlockSize = compressed.length - (floored * blockSize);
  for (var i = 0, k = 0; i < blocks; i++) {
    var byteSize = (i !== blocks - 1) ? blockSize : lastBlockSize - 1;
    var bytes = new Uint8Array(byteSize + 1);
    for (j = 0; j <= byteSize; j++) {
      bytes[j] = compressed[k];
      k++;
    }
    k--;
    var ext = path.extname(file);
    var cfile = path.join(dir, `/${path.basename(file, ext)}.${i}.chunk.compressed${ext}`);
    fs.writeFileSync(cfile, bytes);
  }
}

if (!fs.existsSync(dir)) fs.mkdirSync(dir);

glob(path.join(searchPath, '{scripts,main,styles}.*.{js,css}'), (er, files) => {
  files.forEach(file => {
    var contents = pako.deflate(fs.readFileSync(file));
    var filename = path.basename(file, path.extname(file));
    var fileExtension = path.extname(file);
    // Currently applying chunks only for main file.
    if (filename.indexOf('main') > -1 && contents.length > blockSize) {
      splitCompression(contents, file);
      console.log(`Chunks compression applied on - ${filename}${fileExtension}`)
    } else {
      var compressedFile = `${dir}/${filename}.compressed${fileExtension}`;
      fs.writeFileSync(compressedFile, contents);
    }
  });
  console.log(`Compression completed for - ${files.map(x => path.basename(x)).join(';')}`);
});

var exec = require('child_process').exec;
var resolve = require('path').resolve;
var Q = require('q');

var FILE_EXTENSIONS = {
    'jpg' : 'image/jpeg',
    'png' : 'image/png',
    'gif' : 'image/gif'
};

var fileNameRe = /.*\/(.+)$/;

var FileDescriptor = function(filePath) {
    var absolutePath = resolve(filePath);
    var i = absolutePath.lastIndexOf('.');
    if (!i) throw new Error("File cannot be found");
    var extension = absolutePath.substr(i+1);
    var fileName = absolutePath.substr(0, i).match(fileNameRe)[1];
    var contentType = FILE_EXTENSIONS[extension.toLowerCase()];

    this.getPath = function() { return absolutePath; }
    this.getName = function() { return fileName; }
    this.getFormat = function() { return extension; }
    this.getContentType = function() { return contentType; }
}

var createSignedS3Decorator = function(client) {
    return function(url) {
        var expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 30);
        return client.signedUrl(url, expiration);
    };
}

var resizePhoto = function(fileObject) {
    var oldFile = fileObject.getPath();
    var newFile = '/tmp/' + fileObject.getName() + '-compressed.' + fileObject.getFormat();
    var command = 'convert ' + oldFile + ' -resize 300 ' + newFile;

    var d = Q.defer();
    exec(command, function(err, stdout, stderr) {
        err ? d.reject(stderr) : d.resolve(new FileDescriptor(newFile));
    });
    return d.promise;
}

var storeImageInS3 = function(imageUploadDir, client, fileObject, imageBuffer) {

    var d = Q.defer();
    var filePath = imageUploadDir + fileObject.getName() + '.' + fileObject.getFormat();

    var headers = {
      'Content-Type': fileObject.getContentType()
    };

    client.putBuffer(imageBuffer, filePath, headers, function(err, res) {
        !err && (res.statusCode === 200) ? d.resolve(filePath) : d.reject(err);
    });
    return d.promise;
};

exports.createSignedS3Decorator = createSignedS3Decorator;
exports.storeImageInS3 = storeImageInS3;
exports.FileDescriptor = FileDescriptor;
exports.resizePhoto = resizePhoto;

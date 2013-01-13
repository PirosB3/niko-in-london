var exec = require('child_process').exec;
var resolve = require('path').resolve;
var Q = require('q');

var FILE_EXTENSIONS = {
    'jpg' : 'image/jpeg',
    'png' : 'image/png',
    'gif' : 'image/gif'
};

var fileNameRe = /.*\/(.+)$/;

var FileDescriptor = function(args) {
    var absolutePath = resolve(args.path);
    var fileName = args.fileName;

    var i = fileName.lastIndexOf('.');
    if (!i) throw new Error("File cannot be found");
    var extension = fileName.substr(i+1);
    var name = fileName.substr(0, i);
    var contentType = args.contentType;

    this.getPath = function() { return absolutePath; }
    this.getName = function() { return name; }
    this.getFormat = function() { return extension; }
    this.getFileName = function() { return fileName; }
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
    var newFileName = fileObject.getName() + '-compressed.' + fileObject.getFormat();
    var newFilePath = '/tmp/' + newFileName;
    var command = 'convert ' + oldFile + ' -resize 300 ' + newFilePath;

    var d = Q.defer();
    exec(command, function(err, stdout, stderr) {
        err ? d.reject(stderr) : d.resolve(new FileDescriptor({
            path: newFilePath,
            fileName: newFileName,
            contentType: fileObject.getFormat()
        }));
    });
    return d.promise;
}

var storeImageInS3 = function(imageUploadDir, client, fileObject, imageBuffer) {

    var d = Q.defer();
    var filePath = imageUploadDir + fileObject.getFileName();

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

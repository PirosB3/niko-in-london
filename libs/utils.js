var fs = require('fs');
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
    var contentType = args.contentType;

    var i = fileName.lastIndexOf('.');
    if (!i) throw new Error("File cannot be found");
    var extension = fileName.substr(i+1);
    var name = fileName.substr(0, i);

    this.getPath = function() { return absolutePath; }
    this.getName = function() { return name; }
    this.getFormat = function() { return extension; }
    this.getFileName = function() { return fileName; }
    this.getContentType = function() { return contentType; }
}

var saveBase64Image = function(img) {
    var d = Q.defer();
    var base64Data = img.replace(/^data:image\/png;base64,/,"");
    var binaryData = new Buffer(base64Data, 'base64').toString('binary');

    var newPath = '/tmp/' + Math.random().toString(36).substring(7);
    fs.writeFile(newPath, binaryData, "binary", function(err) {
        return err ? d.reject(err) : d.resolve(newPath);
    });
    return d.promise;
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
    var command = 'convert ' + oldFile + ' -resize 500 ' + newFilePath;

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
exports.saveBase64Image = saveBase64Image;

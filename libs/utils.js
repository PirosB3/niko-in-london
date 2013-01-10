var Q = require('q');

var FILE_EXTENSIONS = {
    'jpg' : 'image/jpeg',
    'png' : 'image/png',
    'gif' : 'image/gif'
};

var getFormat = function(imageName) {
    var i = imageName.lastIndexOf('.');
    if (i < 0) return null;
    return imageName.substr(i+1).toLowerCase();
}

var createSignedS3Decorator = function(client) {
    return function(url) {
        var expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 30);
        return client.signedUrl(url, expiration);
    };
}

var storeImageInS3 = function(imageUploadDir, client, imageName, imageBuffer) {

    var d = Q.defer();
    var filePath = imageUploadDir + imageName;
    var format = getFormat(imageName);
    if (!FILE_EXTENSIONS[format]) return d.reject("File format not recognized");

    var headers = {
      'Content-Type': FILE_EXTENSIONS[format]
    };

    client.putBuffer(imageBuffer, filePath, headers, function(err, res) {
        !err && (res.statusCode === 200) ? d.resolve(filePath) : d.reject(err);
    });
    return d.promise;
};

exports.createSignedS3Decorator = createSignedS3Decorator;
exports.storeImageInS3 = storeImageInS3;
exports.getContentType = getContentType;

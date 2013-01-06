var Q = require('q');

var FILE_EXTENSIONS = {
    'jpg' : 'image/jpeg',
    'png' : 'image/png',
    'gif' : 'image/gif'
};

var getContentType = function(imageName) {
    var i = imageName.lastIndexOf('.');
    if (i < 0) return null;
    var format = imageName.substr(i+1).toLowerCase();
    return FILE_EXTENSIONS[format] || null;
}

var createSignedS3Decorator = function(client) {
    return function(url) {
        var expiration = new Date();
        expiration.setMinutes(expiration.getMinutes() + 30);
        return client.signedUrl(url, expiration);
    };
}

var storeImageInS3 = function(imageUploadDir, client, imageName, imageBuffer) {

    var filePath = imageUploadDir + imageName;
    var headers = {
      'Content-Type': getContentType(imageName)
    };

    var d = Q.defer();
    client.putBuffer(imageBuffer, filePath, headers, function(err, res) {
        !err && (res.statusCode === 200) ? d.resolve(filePath) : d.reject(err);
    });
    return d.promise;
};

exports.createSignedS3Decorator = createSignedS3Decorator;
exports.storeImageInS3 = storeImageInS3;
exports.getContentType = getContentType;

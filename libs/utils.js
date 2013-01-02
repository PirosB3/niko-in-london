var Q = require('q');

var getFileExtension = function(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
};

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
      'Content-Type': 'image/' + getFileExtension(imageName)
    };

    var d = Q.defer();
    client.putBuffer(imageBuffer, filePath, headers, function(err, res) {
        !err && (res.statusCode === 200) ? d.resolve(imageName) : d.reject(err);
    });
    return d.promise;
};

exports.createSignedS3Decorator = createSignedS3Decorator;
exports.storeImageInS3 = storeImageInS3;

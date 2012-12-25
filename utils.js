var Q = require('q');
var settings = require('./settings.js').settings;

function _getFileExtension(filename) {
    var i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i);
};

var createSignedS3Url = function(client, url) {
    var expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + 30);
    return client.signedUrl(url, expiration);
};

var storeImageInS3 = function(client, imageName, imageBuffer) {

    var filePath = settings.IMAGE_UPLOAD_DIR + imageName;
    var headers = {
      'Content-Type': 'image/' + _getFileExtension(imageName)
    };

    var d = Q.defer();
    client.putBuffer(imageBuffer, filePath, headers, function(err, res) {
        !err && (res.statusCode === 200) ? d.resolve() : d.reject(err);
    });
    return d.promise;
};

exports.createSignedS3Url = createSignedS3Url;
exports.storeImageInS3 = storeImageInS3;

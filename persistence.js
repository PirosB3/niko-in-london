var Q = require('q');
var _ = require('underscore')._;

var getAllPhotos = function(db) {
    var q = Q.defer();
    db.collection('photos', function(err, coll) {
        if (err) q.reject(err);
        coll.count(function(err, count) {
            if (err) q.reject(err);
            q.resolve(count);
        });
    });
    return q.promise;
}

var addPhoto = function(photo, db) {
    var d = Q.defer();
    if (!(photo.title && photo.path)) {
        d.reject(new Error("Path and Title must be defined"));
    } else {
        db.collection('photos', function(err, coll) {
            if (err) d.reject(err);
            coll.insert(_.extend({
                comments : []
            }, photo), function(err, res) {
                if (err) return d.reject(err);
                d.resolve(res[0]);
            });
        });
    }
    return d.promise;
};

exports.getAllPhotos = getAllPhotos;
exports.addPhoto = addPhoto;

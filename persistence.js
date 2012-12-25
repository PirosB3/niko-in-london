var Q = require('q');

var getAllPhotos = function(db) {
    var q = Q.defer();
    db.collection('photos', function(err, coll) {
        if (err) q.reject(err);
        coll.count(function(err, count) {
            if (err) q.reject(err);
            console.log("RESOLVE");
            q.resolve(count);
        });
    });
    return q.promise;
}

exports.getAllPhotos = getAllPhotos;

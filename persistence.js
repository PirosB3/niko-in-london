var Q = require('q');
var _ = require('underscore')._;
var MongoClient = require('mongodb').MongoClient;

var PhotosCollection = function(opts) {
    if(!(opts.mongoUrl && opts.collectionName)) {
        throw new Error("mongoUrl and collectionName must be specified");
    }

    var collection;
    var getCollection = function() {
        if (collection) return collection;

        var d = Q.defer();
        MongoClient.connect(opts.mongoUrl, function(err, db) {
            if (err) d.reject(err);
            db.collection(opts.collectionName, function(err, coll) {
                if (err) d.reject(err);
                collection = coll;
                d.resolve(coll);
            });
        });
        return d.promise;
    };

    this.getAllPhotos = function() {
        var d = Q.defer();
        Q.when(getCollection()).then(function(coll) {
            coll.count(function(err, count) {
                if (err) d.reject(err);
                d.resolve(count);
            });
        }, d.reject);
        return d.promise;
    };
}

exports.PhotosCollection = PhotosCollection;

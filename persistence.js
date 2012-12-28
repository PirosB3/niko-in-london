var Q = require('q');
var _ = require('underscore')._;
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var PhotosCollection = function(opts) {
    if(!(opts.collection || (opts.mongoUrl && opts.collectionName))) {
        throw new Error("mongoUrl and collectionName must be specified");
    }
    var collection;
    if (opts.collection) collection = opts.collection;

    var getCollection = function() {
        if (collection) return collection;

        var d = Q.defer();
        MongoClient.connect(opts.mongoUrl, function(err, db) {
            if (err) d.reject(err);
            db.collection(opts.collectionName, function(err, coll) {
                if (err) return d.reject(err);
                collection = coll;
                d.resolve(coll);
            });
        });
        return d.promise;
    };

    this.addPhoto = function(photo) {
        var d = Q.defer();
        Q.when(getCollection()).then(function(coll) {
            if (!(photo.title && photo.path)) return d.reject(new Error("Path and Title must be defined"));
             coll.insert(_.extend({
                 comments : []
             }, photo), function(err, res) {
                 if (err) return d.reject(err);
                 d.resolve(res[0]);
             });
        }, d.reject);
        return d.promise;
    };

    this.getAllPhotos = function() {
        var d = Q.defer();
        Q.when(getCollection()).then(function(coll) {
            coll.find().toArray(function(err, cursor) {
                if (err) return d.reject(err);
                d.resolve(cursor);
            });
        }, d.reject);
        return d.promise;
    };

    this.addCommentForPhotoID = function(photoId, comment) {
        var d = Q.defer();
        if (!(comment.body && comment.userId)) return d.reject(new Error("Body and UserID must be defined"));
        try {
            var objectID = new ObjectID(photoId);
            Q.when(getCollection()).then(function(coll) {
                coll.findAndModify(
                    { _id: objectID }, [],
                    { $push: {comments: comment} },
                    { new: true },
                    function(err, object) {
                        if (err) return d.reject(err);
                        d.resolve(object);
                    }
                );
            }, d.reject);
        } catch (e) { d.reject(e); }
        return d.promise;
    }
}

exports.PhotosCollection = PhotosCollection;

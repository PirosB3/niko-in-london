var Q = require('q');
var _ = require('underscore')._;
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var Persistence = function(opts) {
    if(!(opts.database || (opts.mongoUrl && opts.collectionName))) {
        throw new Error("mongoUrl and collectionName must be specified");
    }

    collections = {};
    var database;
    if (opts.database) database = opts.database;

    var getDb = function() {
        if (database) return database;

        var d = Q.defer();
        MongoClient.connect(opts.mongoUrl, function(err, db) {
            if (err) return d.reject(err);
            database = db;
            d.resolve(db);
        });
        return d.promise;
    }

    var getCollection = function(name) {
        if (collections[name]) return collections[name];

        var d = Q.defer();
        Q.when(getDb()).then(function(db) {
            db.collection(name, function(err, coll) {
                if (err) return d.reject(err);
                collections[name] = coll;
                d.resolve(coll);
            });
        }, d.reject);
        return d.promise;
    };

    this.addPhoto = function(photo) {
        var d = Q.defer();
        Q.when(getCollection('photos')).then(function(coll) {
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
        Q.when(getCollection('photos')).then(function(coll) {
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
            Q.when(getCollection('photos')).then(function(coll) {
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
    };

    this.upsertUser = function(user) {
        var d = Q.defer();
        if (!(user.id && user.name)) return d.reject(new Error("ID and name must be defined"));
        Q.when(getCollection('users')).then(function(coll) {
            coll.findAndModify(
                { id : user.id }, [],
                { $set: user },
                { new: true, upsert: true },
                function(err, object) {
                    if (err) return d.reject(err);
                    d.resolve(object);
                }
            );
        }, d.reject);
        return d.promise;
    }
}

exports.Persistence = Persistence;

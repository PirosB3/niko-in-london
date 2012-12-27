var buster = require('buster');
var knox = require('knox');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;

var utils = require('./utils.js');
var persistence = require('./persistence.js');

var client = knox.createClient({
    key: settings.AMAZON_S3_KEY
  , secret: settings.AMAZON_S3_SECRET
  , bucket: settings.AMAZON_S3_BUCKET
});

var logo = fs.readFileSync('./logo.png')

buster.testCase('utils', {
    setUp : function() {
        this.timeout = 1000;
    },
    'it should return a string' : function() {
        var url = utils.createSignedS3Url(client, '/hello/world');
        assert.same(typeof url, 'string');
    },
    'it should return true' : function(done) {
        var path = utils.storeImageInS3(client, 'nodejs-logo.png', logo);
        path.then(function(imageName) {
            assert.same(imageName, 'nodejs-logo.png');
            done();
        }, function(e) {
            throw e;
        });
    }
});

buster.testCase('persistence', {
    setUp : function(done) {
        var _this = this;
        MongoClient.connect(settings.MONGO_URL_TEST, function(err, db) {
            db.collection('photos', function(err, coll) {
                _this.photoCollection = new persistence.PhotosCollection({
                    collection: coll
                });
                coll.remove(function() {
                    done();
                });
            });
        });
    },
    'it should add a photo to mongodb' : function(done) {
      var photo = {
          title: 'Hello World',
          path: 'hello-world.png'
      };
      var _this = this;
      _this.photoCollection.getAllPhotos().then(function(photos) {
          assert.same(photos.length, 0);
          _this.photoCollection.addPhoto(photo).then(function(result) {
              assert.same(result.comments.length, 0);
              assert(result._id);
              _this.photoCollection.getAllPhotos().then(function(photos) {
                  assert.same(photos.length, 1);
                  done();
              });
          });
      });
    }
});

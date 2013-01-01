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
        this.timeout = 1000;
        var _this = this;
        MongoClient.connect(settings.MONGO_URL_TEST, function(err, db) {
            _this.persistence = new persistence.Persistence({
                database: db
            });
            db.collection('photos', function(err, coll) {
                coll.remove(done);
            });
        });
    },
    'it should add a photo to mongodb' : function(done) {
      var photo = {
          title: 'Hello World',
          path: 'hello-world.png'
      };
      var _this = this;
      _this.persistence.getAllPhotos().then(function(photos) {
          assert.same(photos.length, 0);
          _this.persistence.addPhoto(photo).then(function(result) {
              assert.same(result.comments.length, 0);
              assert(result._id);
              assert(result.date_added);
              _this.persistence.getAllPhotos().then(function(photos) {
                  assert.same(photos.length, 1);
                  done();
              });
          });
      });
    },
    'it should add a comment to an existing photo' : function(done) {
      var photo = {
          title: 'Hello World',
          path: 'hello-world.png'
      };
      var comment = {
          userId : 'daniel-pyrathon',
          body: 'bella foto!'
      };
      var _this = this;
      _this.persistence.addPhoto(photo).then(function(result) {
        _this.persistence.addCommentForPhotoID(result._id.toString(), comment).then(function(result) {
            assert.same(result.title, 'Hello World');
            assert(result.comments[0].date_added);
            assert.same(result.comments[0].body, 'bella foto!');
            done();
        });
      });
    },
    'if photo non existant should fail' : function(done) {
      var comment = {
          userId : 'daniel-pyrathon',
          body: 'bella foto!'
      };
      this.persistence.addCommentForPhotoID('nonexisting', comment).then(undefined, function(e) {
          assert(e);
          done();
      });
    },
    'it should retrieve or add a new user' : function(done) {
        var user = {
            id: '126318927',
            name : 'Daniel Pyrathon'
        };
        var _this = this;
        _this.persistence.upsertUser(user).then(function(res) {
            assert.same(res.id, '126318927');
            var _id = res._id;
            _this.persistence.upsertUser(user).then(function(res) {
                assert.same(res._id.toString(), _id.toString());
                done();
            });
        });
    }
});

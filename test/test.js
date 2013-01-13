var buster = require('buster');
var knox = require('knox');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;

var utils = require('../libs/utils.js');
var persistence = require('../libs/persistence.js');
var settings = require('../settings.js').settings;

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
        var pathDecorator = utils.createSignedS3Decorator(client);
        var url = pathDecorator('/hello/world');
        assert.same(typeof url, 'string');
        assert(/^http/.test(url));
    },
    'it should return true' : function(done) {
        var fileObject = new utils.FileDescriptor({
            path: '/tmp/image',
            fileName: 'nodejs-logo.png',
            contentType: 'image/png'
        });
        var path = utils.storeImageInS3(settings.IMAGE_UPLOAD_DIR, client, fileObject, logo);
        path.then(function(imageName) {
            assert.same(imageName, '/images/nodejs-logo.png');
            done();
        }, function(e) {
            throw e;
        });
    },
    'File object should contain all information regarding file from path' : function() {
        var f = new utils.FileDescriptor({
            path: '/tmp/8ef9c52abe857867fd0a4e9a819d1876',
            fileName: 'edge.png',
            contentType: 'image/png'
        });
        assert.same(f.getPath(), '/tmp/8ef9c52abe857867fd0a4e9a819d1876');
        assert.same(f.getName(), 'edge');
        assert.same(f.getFormat(), 'png');
        assert.same(f.getFileName(), 'edge.png');
        assert.same(f.getContentType(), 'image/png');
    },
    "it should be able to resize photos" : function(done) {
        var f = new utils.FileDescriptor({
            path: './logo.png',
            fileName: 'logo.png',
            contentType: 'image/png'
        });
        utils.resizePhoto(f).then(function(f2) {
            assert.same(f2.getName(), 'logo-compressed');
            done();
        });
    }
});

buster.testCase('persistence', {
    setUp : function(done) {
        this.timeout = 1000;
        var _this = this;
        MongoClient.connect(settings.MONGO_URL_TEST, function(err, db) {
            _this.persistence = new persistence.Persistence({
                database: db,
                pathDecorator : utils.createSignedS3Decorator(client)
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
              assert(/^http/.test(result.path));
              _this.persistence.getAllPhotos().then(function(photos) {
                  assert.same(photos.length, 1);
                  assert(/^http/.test(photos[0].path));
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
            assert(result.date_added);
            assert.same(result.userId, 'daniel-pyrathon');
            assert.same(result.body, 'bella foto!');
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

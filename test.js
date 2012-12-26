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
        this.timeout = 2000;
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
        MongoClient.connect(settings.MONGO_URL_TEST, function(err, _db) {
            _db.collection('photos', function(err, coll) {
                coll.remove(function(err, coll) {
                    _this.db = _db;
                    done();
                });;
            });
        });
    },
    'it should add a photo to mongodb' : function(done) {
      var db = this.db;
      var photo = {
          title: 'Hello World',
          path: 'hello-world.png'
      };
      persistence.getAllPhotos(db).then(function(count) {
          assert.same(count, 0);
          persistence.addPhoto(photo, db).then(function(res) {
              assert.same(res.comments.length, 0);
              persistence.getAllPhotos(db).then(function(count) {
                  assert.same(1, count);
                  done();
              });
          });
      });
    },
    'it should refute if required attr are not filled in': function(done) {
          persistence.addPhoto({}, this.db).then(undefined, function(e) {
              assert(e);
              done();
          });
    }
});













//describe('persistence', function(){

    //beforeEach(function(done) {
    //});

    //it('should add a photo to mongodb', function(done){
    //});
//});


var assert = require("assert");
var knox = require('knox');
var fs = require('fs');

var settings = require('./settings.js').settings;
var utils = require('./utils.js');
var persistence = require('./persistence.js');

var client = knox.createClient({
    key: settings.AMAZON_S3_KEY
  , secret: settings.AMAZON_S3_SECRET
  , bucket: settings.AMAZON_S3_BUCKET
});

var logo = fs.readFileSync('./logo.png')

describe('utils', function(){
  describe('#createSignedS3Url', function(){
    it('should return a string', function(){
        var url = utils.createSignedS3Url(client, '/hello/world');
        assert.equal(typeof url, 'string');
    });
  });
  describe('#storeImage', function(){
    it('should return true', function(done){
        var path = utils.storeImageInS3(client, 'nodejs-logo.png', logo);
        path.then(done, function(e) {
            throw e;
        });
    });
  });
});

describe('persistence', function(){
    var MongoClient = require('mongodb').MongoClient;
    var db;

    beforeEach(function(done) {
        MongoClient.connect(settings.MONGO_URL_TEST, function(err, _db) {
            console.log("INIT");
            _db.collection('photos', function(err, coll) {
                coll.remove(function(err, coll) {
                    db = _db;
                    done();
                });;
            });
        });
    });

    it('should add a photo to mongodb', function(done){
      var photo = {
          title: 'Hello World',
          image: {
              buffer: logo,
              filename: 'hello-world.png'
          }
      };
      persistence.getAllPhotos(db).then(function(count) {
          conssole.log(count);
          //done(count === 0);
      });
    });
});

                //persistence.addPhoto(photo, db).then(function(res) {
                    //assert.equal(res.comments.length, 0);
                    //persistence.getAllPhotos(db).then(function(count) {
                        //assert.equal(1, count);
                        //done();
                    //});
                //});

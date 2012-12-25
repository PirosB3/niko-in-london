var assert = require("assert");
var knox = require('knox');
var fs = require('fs');

var settings = require('./settings.js').settings;
var persistence = require('./persistence.js');
var utils = require('./utils.js');

  var MongoClient = require('mongodb').MongoClient;
  MongoClient.connect(settings.MONGO_URL_TEST, function(err, db) {
    if (err) throw err;
    var photo = {
        title: 'Hello World',
        image: {
            buffer: '',
            filename: 'hello-world.png'
        }
    };
    persistence.getAllPhotos(db).then(function(count) {
        console.log(count);
        db.close();
    });
  });

var express = require('express')
  , http = require('http')
  , fs = require('fs')

  , Q = require('q')
  , _ = require('underscore')._
  , knox = require('knox')
  , settings = require('./settings.js').settings
  , utils = require('./libs/utils.js')
  , Persistence = require('./libs/persistence.js').Persistence;


var app = express();
var persistence = new Persistence({
    mongoUrl: settings.MONGO_URL
});
var client = knox.createClient({
    key: settings.AMAZON_S3_KEY
  , secret: settings.AMAZON_S3_SECRET
  , bucket: settings.AMAZON_S3_BUCKET
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.bodyParser());
  app.use(express.favicon());
  app.use(express.logger('dev'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/photos', function(req, res) {
    Q.when(persistence.getAllPhotos()).then(_.bind(res.json, res),
        function(err) { res.json(500, { error: 'There was an issue retrieving the photos' }) }
    );
});

app.put('/photos/create', function(req, res) {
    if (!(req.files.image && req.body.title)) {
        return res.json({ error: 'You must specify an image and a title' });
    }
    fs.readFile(req.files.image.path, function(err, data) {
        if (err) return res.json({ error: 'There was an error loading your file' });
        Q.when(utils.storeImageInS3(settings.IMAGE_UPLOAD_DIR, client, req.files.image.name, data))
            .then(function(imagePath) {
                Q.when(persistence.addPhoto({ title: req.body.title, path: imagePath}))
                    .then(_.bind(res.json, res), function(err) {
                        res.json(500, { error: 'There was an issue saving your photo' });
                    });
            }, function(err) {
                res.json(500, { error: 'There was an issue uploading your photo' });
            });
        });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

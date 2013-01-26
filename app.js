var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , path = require('path')

  , Q = require('q')
  , _ = require('underscore')._
  , knox = require('knox')
  , settings = require('./settings.js').settings
  , utils = require('./libs/utils.js')
  , Persistence = require('./libs/persistence.js').Persistence;


var app = express();
var client = knox.createClient({
    key: settings.AMAZON_S3_KEY
  , secret: settings.AMAZON_S3_SECRET
  , bucket: settings.AMAZON_S3_BUCKET
});
var persistence = new Persistence({
    mongoUrl: settings.MONGO_URL,
    pathDecorator : utils.createSignedS3Decorator(client)
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/templates');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/photos', function(req, res) {
    Q.when(persistence.getAllPhotos()).then(_.bind(res.json, res),
        function(err) { res.json(500, { error: 'There was an issue retrieving the photos' }) }
    );
});

app.post('/photos', function(req, res) {
    if (!(req.files.image && req.body.title)) {
        return res.json({ error: 'You must specify an image and a title' });
    }

    var fileObject = new utils.FileDescriptor({
        path: req.files.image.path,
        fileName: req.files.image.name,
        contentType: req.files.image.type
    });
    Q.when(utils.resizePhoto(fileObject)).then(function(fileObject) {
        fs.readFile(fileObject.getPath(), function(err, data) {
            if (err) return res.json({ error: 'There was an error loading your file' });
                Q.when(utils.storeImageInS3(settings.IMAGE_UPLOAD_DIR, client, fileObject, data))
                .then(function(imagePath) {
                    Q.when(persistence.addPhoto({ title: req.body.title, path: imagePath}))
                        .then(_.bind(res.json, res), function(err) {
                            res.json(500, { error: 'There was an issue saving your photo' });
                        });
                }, function(err) {
                    res.json(500, { error: err });
                });
        });
    }, function(err) {
        res.json(500, { error: "There was an issue resizing your photo" });
    });
});

app.post('/photos/:id/comments', function(req, res) {
    if (!req.body.body) {
        return res.json({ error: 'You must specify a comment body' });
    }
    Q.when(persistence.addCommentForPhotoID(req.params.id, {
        body: req.body.body,
        userId: 'daniel-pyrathon'
    })).then(_.bind(res.json, res), function(err) {
        res.json({ error: 'There was an issue inserting your comment on photo ' + req.params.id });
    });
});

app.get('/', function(req, res) {
    res.render('index', {});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

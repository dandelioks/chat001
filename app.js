var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var errorhandler = require('errorhandler');
var http = require('http');
var fs = require('fs');
var config = require('./config/index');
var log = require('./lib/log')(module);
//var mongoose = require('lib/mongoose');
var HttpError = require('error').HttpError;
var bodyParser  =  require ( 'body-parser' )
var  multer   =  require ( 'multer' )
var  favicon  =  require ( 'serve-favicon' ) //иконка нам пока не нужна
var debug = require('debug')('app4');
var  session  =  require ( 'express-session' )
//var sessionStore = require('./lib/sessionStore');

var app = express();

app.set('views', __dirname + '/template');
app.set('view engine', 'jade');

//app.use(favicon()); иконка нам пока не нужна

if (app.get('env') === 'development') {
  app.use(logger('dev'));
} else {
  app.use(logger('default'));
}

app.use(bodyParser.text( // выползло из body parser'a
    {
      keepExtensions: true,
      uploadDir: './public/uploads/'
    }
));
//app.use(multer());

app.use(cookieParser());

/*
app.use(session({
  secret: config.get('session:secret'),
  key: config.get('session:key'),
  cookie: config.get('session:cookie'),
  store: sessionStore
}));*/

app.use(require('./middleware/sendHttpError'));
//app.use(require('./middleware/loadUser'));

//app.use(app.router);

require('./routes')(app);

app.use(express.static(path.join(__dirname, 'public')));


app.use(function (err, req, res, next) {
  if (typeof err == 'number') {
    err = new HttpError(err);
  }

  if (err instanceof HttpError) {
    res.sendHttpError(err);
  } else {
    if (app.get('env') === 'development') {
      errorhandler()(err, req, res, next);
    } else {
      log.error(err);
      err = new HttpError(500);
      res.sendHttpError(err);
    }
  }
});


var server = http.createServer(app);

var io = require('./socket')(server);
app.set('io', io);

server.listen(config.get('port'), function () {
  console.log("Server started at %d port", config.get('port'));
});

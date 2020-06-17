//добавление зависимостей 14.41

//фунцкии
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan'); //morgan - HTTP request logger middleware for node.js
var errorhandler = require('errorhandler');
var session  =  require ( 'express-session' );

//переменные
var path = require('path');
var http = require('http');
var sessionStore = require('./lib/sessionStore');

//модули
var config = require('./config/index');
var bodyParser  =  require ( 'body-parser' );

var log = require('./lib/log')(module);
var HttpError = require('./error/index').HttpError;

//неактивно
/*
var  favicon  =  require ( 'serve-favicon' ) //иконка нам пока не нужна
*/

var app = express();//все так делают. а мы чем хуже?

//======================================================================================================================

app.set('views', __dirname + '/template'); //где находятся views
app.use(express.static(path.join(__dirname, 'public')));//где находится статика

app.set('view engine', 'pug'); //подключаем мопса

//app.use(favicon()); иконка нам пока не нужна

// режим среды = разработка?
// тогда сделай логи в стиле dev (с цветами, красивенький)
// иначе в стиле default
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

app.use(cookieParser());

//параметры берутся .get-ом из config/config.json
app.use(session({
  resave: false,
  secret: config.get('session:secret'),
  key: config.get('session:key'),
  saveUninitialized: false, //реализация сеансов входа в систему
  cookie: config.get('session:cookie'),
  store: sessionStore
}));

app.use(require('./middleware/sendHttpError'));
app.use(require('./middleware/loadUser'));

require('./routes')(app);




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

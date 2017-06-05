const Koa = require('koa');
const Router = require('koa-router');
const convert = require('koa-convert');
const koaBody = require('koa-body');
const logger = require('koa-logger');
const co = require('co');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev });
const handle = app.getRequestHandler();

const mongoose = require('mongoose');


const indexRoute = require('./src/middleware/routes/index.js');
const formRecordRoute = require('./src/middleware/routes/formRecord.js');


const LRUCache = require('lru-cache');
const ssrCache = new LRUCache({
  max: 100,
  maxAge: 1000 * 60 * 60 // 1hour
});

function initModels() {
  var fs = require('fs');
  var models_path = __dirname + '/src/middleware/models';
  var models = fs.readdirSync(models_path);
  // NOTE: some models seem to be broken. once fixed, the following code will work

  models.forEach(function (file) {
    if (~file.indexOf('.js')) {
      //console.log('Trying to require %s',file);
      require(models_path + '/' + file);
    }
  });
}

app.prepare()
.then(() => {
  const server = new Koa();
  const router = new Router();

  mongoose.connect('mongodb://localhost/test');
  const db = mongoose.connection;

  db.on('error', function(err) {
    console.error('error occurs:', JSON.stringify(err));
    mongoose.disconnect();
  });

  db.once('open', function(err) {
    if (err) {
      console.error(JSON.stringify(err));
      return;
    }
    initModels();
    console.log('mongoose opened');
  });

  // middlewares
  // server.use(convert(bodyparser));
  // server.use(convert(json()));
  // server.use(convert(logger()));
  // server.use(convert(server(__dirname+'/pages')));  
  
  server.use(function *(next){
    var start = new Date;
    yield next;
    var ms = new Date - start;
    this.set('X-Response-Time', ms + 'ms');
  });  

  server.use(function *(next){
    var start = new Date;
    yield next;
    var ms = new Date - start;
    console.log('%s %s - %s', this.method, this.url, ms);
  });


  
  // routers
  [
    indexRoute, 
    formRecordRoute
  ].map((route) => {
    server.use(route.routes(), route.allowedMethods());
  });


  router.get('/index', co.wrap(function *(ctx) {
    yield app.render(ctx.req, ctx.res, '/index', ctx.query);
    ctx.respond = false;
  }));

  router.get('/list', co.wrap(function *(ctx) {
    yield renderAndCache(ctx.req, ctx.res, '/list', ctx.query);
    ctx.respond = false;
  }));

  router.get('/b', co.wrap(function *(ctx) {
    yield app.render(ctx.req, ctx.res, '/b', ctx.query);
    ctx.respond = false;
  }));

  server.use(router.routes(), router.allowedMethods())

  // error logger
  server.on('error', function *(err, ctx) {
    yield console.log('error occured:', err);
  });

  server.listen(3000, function (err) {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});


function renderAndCache(req, res, path, query) {
  let html;
  let cacheKey = getCacheKey(req);

  if (html = ssrCache.get(cacheKey)) {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', Buffer.byteLength(html));
    console.log(`Hit cache key ${cacheKey}`);
    res.end(html);
    return;
  }

  return app.renderToHTML(req, res, path, query)
    .then((html) => {
      console.log(`Miss cache ${path}`);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Length', Buffer.byteLength(html));
      ssrCache.set(path, html);
      res.end(html);
    }).catch((e) => {
      console.error(e);
    });
}

function getCacheKey(req) {
  return `${req.url}`;
}




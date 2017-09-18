const env = process.env;
global.production = env.NODE_ENV == 'production';
const isDev = !global.production;

if (global.production) {
  require('newrelic');
}

const express = require('express');
const logger = require('morgan');
const path = require('path');

logger.token('fwd', function(req) {
  return (req.get('x-forwarded-for') || '').replace(/\s/g, '');
});

function createApp() {
  const app = express();

  app.locals.modules = path.join(__dirname, '..', 'node_modules');

  app.use((req, res, n) => {
    app.locals.host = `${req.protocol}://${req.get('host')}`;
    app.locals.originalUrl = `${app.locals.host}${req.path}`;
    n();
  });

  console.log('[ENV]', env.NODE_ENV);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');
  app.disable('x-powered-by');
  app.enable('trust proxy');
  app.use(express.static('app/public'));

  if (isDev) {
    app.locals.pretty = true;
  }

  app.use(
    logger(
      global.production
        ? ':method ":url" :status host=:req[host] referrer=":referrer" cf_ray=:req[cf-ray] fwd=:fwd bytes=:res[content-length] :response-time ms request_id=:req[x-request-id] agent=":user-agent"'
        : 'dev'
    )
  );

  app.get('/', function(request, reply) {
    reply.render('home', {
      title: 'Home',
      content: ``
    });
  });

  app.use('/entypo', require('./icons/entypo'));
  app.use('/feather', require('./icons/feather'));
  app.use('/fontawesome', require('./icons/font-awesome'));
  app.use('/material', require('./icons/material'));
  app.use('/octicons', require('./icons/octicons'));
  app.use('/simple', require('./icons/simple'));

  app.use(function(req, res) {
    var err = new Error('Not Found');
    err.status = 404;

    console.log(
      '[ERROR]',
      new Date().toISOString(),
      err.status == 404 ? err.message : err.stack,
      req.originalUrl
    );

    if (isDev) {
      return res.json({
        code: err.status || -1,
        error: true,
        message: isDev ? err.message : 'Something went wrong!',
        stack: err.stack
      });
    }

    res.status(404).send('Not Found');
  });

  return app;
}

module.exports = createApp;

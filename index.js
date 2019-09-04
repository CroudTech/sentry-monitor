const app = require('express')();
const run = require('./src/monitor');
const util = require('util')

module.exports = function (config) {

  if (!config.projects && config.project && config.filters) {
    //TODO should I deprecate the old way? This is backwards compatibility for a simpler config model
    //I think it's nice to be liberal in what we accept
    config.projects = [{
      project: config.project,
      filters: config.filters
    }];
  }

  app.use((req, res, next) => {
    if (config.WSM_AUTH_KEY && req.headers['x-wsm_auth_key'] !== config.WSM_AUTH_KEY) {
      res.sendStatus(403);
      throw new Error(`Request denied from ${req.ip}`, req.headers);
    }
    next();
  });

  app.route('/')
    .post((req, res) => {
      run({debug: req.query.debug, config})
        .then(data => res.send(req.query.debug ? data : {}))
        .catch(ex => {
          res.status(500)
            .send(ex.stack ? ex.stack : ex);
          throw ex;
        });
    });
  const execute = function(options) {
    run({debug: options.debug, config})
        .then(data => console.log(options.debug ? util.inspect(data, {showHidden: false, depth: null}) : {}))
        .catch(ex => {
          throw ex;
        });
  }

  return {
    express: app,
    execute: execute
  };
};


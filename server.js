var express = require('express'),
  app = express(),
  conf = require('dotenv').config(),
  port = process.env.REST_API_PORT || 3000,
  mongoose = require('mongoose'),
  bodyParser = require('body-parser'),
  tedDictJob = require('./jobs/cron-job.js'),
  crawlerTalks = require('./jobs/crawler-all-talks.js'),
  crawlerScripts = require('./jobs/crawler-all-scripts.js'),

  Talks = require('./api/models/talksModel'), //created model loading here
  Scripts = require('./api/models/scriptsModel'); //created model loading here

// mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://'+ process.env.DB_HOST +'/'+ process.env.DB_NAME, { useMongoClient: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var routes = require('./api/routes/talksRoutes'); //importing route
routes(app); //register the route

app.use(function(req, res) {
  res.status(404).send({url: req.originalUrl + ' not found'})
});

app.listen(port);
console.log('tedict-api RESTful API server started on: ' + port);

// Run job
crawlerTalks.run();
setTimeout(function() {
  crawlerScripts.run();
}, 300000);

//tedDictJob.run();

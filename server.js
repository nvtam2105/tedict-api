var express = require('express'),
  app = express(),
  conf = require('dotenv').config(),
  port = process.env.PORT || 3000,
  mongoose = require('mongoose'),
  bodyParser = require('body-parser'),
  tedDictJob = require('./job/cron-job.js'),

  Talks = require('./api/models/talksModel'); //created model loading here

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
tedDictJob.run();

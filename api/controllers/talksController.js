'use strict';

var mongoose = require('mongoose'),
Talks = mongoose.model('Talks');

exports.list_all_talks = function(req, res) {
  Talks.find({}, function(err, talk) {
    if (err)
      res.send(err);
    res.json(talk);
  });
};

exports.create_a_talk = function(req, res) {
  var new_talk = new Talks(req.body);
  new_talk.save(function(err, talk) {
    if (err)
      res.send(err);
    res.json(talk);
  });
};

exports.read_a_talk = function(req, res) {
  Talks.findById(req.params.talkId, function(err, talk) {
    if (err)
      res.send(err);
    res.json(talk);
  });
};

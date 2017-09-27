'use strict';

var mongoose = require('mongoose'),
Talks = mongoose.model('Talks');

exports.list_all_talks = function(req, res) {
  Talks.find({}, function(err, talk) {
    if (err)
      res.send(err);
    res.json(talk);
  })
  .sort('-published_at')
  .limit(parseInt(req.params.limit, 10))
  .skip(parseInt(req.params.limit, 10) * parseInt(req.params.offset, 10));

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
  Talks.findOne({ 'id': req.params.talkId }, function(err, talk) {
    if (err)
      res.send(err);
    res.json(talk);
  });
};

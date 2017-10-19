'use strict';

var mongoose = require('mongoose'),
  Talks = mongoose.model('Talks');

exports.list_all_talks = function (req, res) {
  var search_key = req.params.search;
  var criteria = {};
  if (search_key) {
    criteria = { 'name': { $regex: '.*' + search_key + '.*' } };
  }
  // console.log(criteria);
  Talks.
    find(criteria).
    sort('-published_at').
    limit(parseInt(req.params.limit, 10)).
    skip(parseInt(req.params.limit, 10) * parseInt(req.params.offset, 10)).
    select({
      '_id': 0,
      'id': 1,
      'event': 1,
      'name': 1,
      'slug': 1,
      'description': 1,
      'native_language_code': 1,
      'speaker': 1,
      'published_at': 1,
      'image': 1,
      'media': 1,
      'tag': 1,
      'length': 1,
      'has_sub': 1,
    }).
    exec(function (err, talk) {
      if (err)
        res.send(err);
      res.json(talk);
    });
};

exports.create_a_talk = function (req, res) {
  var new_talk = new Talks(req.body);
  new_talk.save(function (err, talk) {
    if (err)
      res.send(err);
    res.json(talk);
  });
};

exports.read_a_talk = function (req, res) {
  Talks.findOne({ 'id': req.params.talkId }).
    select({
      '_id': 0,
      'id': 1,
      'event': 1,
      'name': 1,
      'slug': 1,
      'description': 1,
      'native_language_code': 1,
      'speaker': 1,
      'published_at': 1,
      'image': 1,
      'media': 1,
      'tag': 1,
      'length': 1,
      'has_sub': 1,
    }).
    exec(function (err, talk) {
      if (err)
        res.send(err);
      res.json(talk);
    });
};

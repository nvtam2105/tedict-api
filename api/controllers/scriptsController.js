'use strict';

var mongoose = require('mongoose'),
  Scripts = mongoose.model('Scripts');

exports.get_scripts_of_talk = function (req, res) {
  Scripts.findOne({ 'talk_id': req.params.talkId }).
    select({
      '_id': 0,
      '__v': 0
    }).
    exec(function (err, script) {
      if (err)
        res.send(err);
      res.json(script);
    });
};

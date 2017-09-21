'use strict';

exports.run = function () {
  var cron = require('cron'),
      request = require('request'),
      conf = require('dotenv').config(),
      mongoose = require('mongoose'),
      strformat = require('strformat'),
      Talks = mongoose.model('Talks');

  new cron.CronJob(process.env.CRON_TIME, function() {

        Talks.findOne().sort('-id').exec(function(err, res) {
            var maxId = res ? res.toObject().id : -1;
            // GET news talks
            //console.log(process.env.API_TED_NEW_TALK_URL);
            console.log(strformat(process.env.API_TED_NEW_TALK_URL, {limit: 5}));

            request.get(strformat(process.env.API_TED_NEW_TALK_URL, {limit: 5}), function(req, res) {
              var talks = JSON.parse(res.body).talks;
              for (var index in talks) {
                var talkObj = talks[index].talk;
                if (talkObj.id > maxId) {
                    // GET talk detail by id
                    request.get(strformat(process.env.API_TED_TALK_DETAIL, {id: talkObj.id}), function(req, res) {
                      var talkDetail =JSON.parse(res.body).talk;
                      console.log(talkDetail);

                      // var new_talk = new Talks(talkDetail);
                      // new_talk.save(function(err) {
                      //      if (err)
                      //       res.send(err);
                      // });
                    });
                }
              }
            });
      });
  }, null, true, 'Asia/Ho_Chi_Minh');
};

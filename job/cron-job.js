'use strict';

exports.run = function () {
  var cron = require('cron'),
      request = require('request'),
      conf = require('dotenv').config(),
      mongoose = require('mongoose'),
      strformat = require('strformat'),
      transform = require('jsonpath-object-transform'),
      Talks = mongoose.model('Talks');

  new cron.CronJob(process.env.CRON_TIME, function() {
        Talks.findOne().sort('-id').exec(function(err, res) {
            var maxId = res ? res.toObject().id : -1;
            // GET news talks
            request.get(strformat(process.env.API_TED_NEW_TALK_URL, {limit: 5}), function(req, res) {
              var talks = JSON.parse(res.body).talks;
              for (var index in talks) {
                var talkObj = talks[index].talk;
                if (talkObj.id > maxId) {
                    // GET talk detail by id
                    request.get(strformat(process.env.API_TED_TALK_DETAIL, {id: talkObj.id}), function(req, res) {
                      var talkDetail = JSON.parse(res.body).talk;
                      var template = {
                        id : '$.id',
                        event_id : '$.event_id',
                        name : '$.name',
                        description : '$.description',
                        slug : '$.slug',
                        native_language_code : '$.native_language_code',
                        published_at : '$.published_at',
                        recorded_at : '$.recorded_at',
                        updated_at : '$.updated_at',
                        viewed_count : '$.viewed_count',
                        images : ['$.images', {size : '$.image.size', url : '$.image.url'}],
                        speakers : ['$.speakers', {name: '$.speaker.name'}],
                        tags : ['$.tags', {name: '$.tag'}]

                      };

                      var result = transform(talkDetail, template);
                      result.medias = [];
                      for (var key in talkDetail.media.internal) {
                          var obj  = talkDetail.media.internal[key];
                          result.medias.push({'name' : key, 'url' : obj.uri, 'size' : obj.filesize_bytes, 'mime_type' : obj.mime_type});
                      };

                      result.langs = [];
                      for (var key in talkDetail.languages) {
                          var obj  = talkDetail.languages[key];
                          result.langs.push({'code' : key, 'name' : obj.name });
                      };

                      console.log(result);
                      var new_talk = new Talks(result);
                      new_talk.save(function(err) {
                           if (err)
                            res.send(err);
                      });
                    });
                }
              }
            });
      });
  }, null, true, process.env.TIME_ZONE);
};

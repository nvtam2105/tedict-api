'use strict';

exports.run = function () {
  var cron = require('cron'),
    request = require('request'),
    conf = require('dotenv').config(),
    mongoose = require('mongoose'),
    strformat = require('strformat'),
    transform = require('jsonpath-object-transform'),
    checkEndsWithPeriod = require("check-ends-with-period"),
    forEach = require('async-foreach').forEach,

    Utils = require("../utils/utils.js"),
    vttToJson = require("../utils/vtt-to-json"),
    Talks = mongoose.model('Talks'),
    Scripts = mongoose.model('Scripts');


  new cron.CronJob(process.env.CRON_TIME, function () {
    // get all news talks
    console.log(strformat(process.env.API_TED_TALK_NEW, { limit: process.env.MAX_NUM_TALK }));
    request.get(strformat(process.env.API_TED_TALK_NEW, { limit: process.env.MAX_NUM_TALK }), function (req, res) {
      if (typeof res !== "undefined" && typeof res.body !== "undefined" && res.body.length > 0) {
        var talks = JSON.parse(res.body).talks;
        forEach(talks, function (item, index) {
          var talkObj = item.talk;
          Talks.findOne({ 'id': talkObj.id }, function (err, talk) {
            if (talk == null) {
              var talkId = talkObj.id;
              var nativeLanguageCode = talkObj.native_language_code;
              // get talk detail
              request.get(strformat(process.env.API_TED_TALK_DETAIL, { id: talkId }), function (req, res) {
                if (typeof res !== "undefined" && typeof res.body !== "undefined" && res.body.length > 0) {
                  var talkDetail = JSON.parse(res.body).talk;
                  var template = {
                    id: '$.id',
                    event: '$.event.name',
                    name: '$.name',
                    description: '$.description',
                    image: '$..images[2]..url',
                    tag: '$..tags[0]..tag',

                    speaker: '$..speakers[0]..name',
                    slug: '$.slug',
                    published_at: '$.published_at',
                    recorded_at: '$.recorded_at',
                    updated_at: '$.updated_at',
                    viewed_count: '$.viewed_count',
                    
                    image_16x9: '$.image_16x9',
                    images: ['$.images', { size: '$.image.size', url: '$.image.url' }],
                    speakers: ['$.speakers', { name: '$.speaker.name' }],
                    tags: ['$.tags', { name: '$.tag' }]

                  };

                  var result = transform(talkDetail, template);
                  result.native_language_code = nativeLanguageCode;
                  
                  result.medias = [];
                  for (var key in talkDetail.media.internal) {
                    var obj = talkDetail.media.internal[key];
                    result.medias.push({ 'name': key, 'url': obj.uri, 'size': obj.filesize_bytes, 'mime_type': obj.mime_type });
                  };

                  result.media = result.medias[2].url;

                  result.langs = [];
                  for (var key in talkDetail.languages) {
                    var obj = talkDetail.languages[key];
                    result.langs.push({ 'code': key, 'name': obj.name });
                  };

                  // Truncate data again
                  result.name = result.name.replace(result.speaker + ': ', '');


                  console.log(result);
                  var new_talk = new Talks(result);
                  new_talk.save(function (err) {
                    if (err)
                      console.log(err);
                  });
                }
              });
              // get talk script
              console.log(strformat(process.env.API_TED_TALK_SUB, { id: talkId }));
              request.get(strformat(process.env.API_TED_TALK_SUB, { id: talkId }), function (req, res) {
                if (typeof res !== "undefined" && typeof res.body !== "undefined" && res.body.length > 0) {
                  //console.log(vttToJson(res.body));
                  var sens = vttToJson(res.body).then(function (sens) {
                    var script = {
                      "talk_id": talkId || 0,
                      "sens": sens
                    }
                    if (talkId > 0) {
                      var new_script = new Scripts(script);
                      new_script.save(function (err) {
                        if (err)
                          console.log(err);
                      });
                    }
                  });

                }
              });
            }
          });
        });
      }
    });
  }, null, true, process.env.TIME_ZONE);
};

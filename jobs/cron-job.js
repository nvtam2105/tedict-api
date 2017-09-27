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
      Talks = mongoose.model('Talks'),
      Scripts = mongoose.model('Scripts');

  new cron.CronJob(process.env.CRON_TIME, function() {
      // get all news talks
      request.get(strformat(process.env.API_TED_TALK_NEW, {limit: process.env.MAX_NUM_TALK}), function(req, res) {
        if (typeof res !== "undefined" && typeof res.body !== "undefined") {
          var talks = JSON.parse(res.body).talks;
          forEach(talks, function(item, index) {
            var talkObj = item.talk;
            Talks.findOne({ 'id': talkObj.id }, function(err, talk) {
              if (talk == null) {
                var talkId = talkObj.id;
                // get talk detail
                request.get(strformat(process.env.API_TED_TALK_DETAIL, {id: talkId}), function(req, res) {
                  if (typeof res !== "undefined" && typeof res.body !== "undefined") {
                    var talkDetail = JSON.parse(res.body).talk;
                    var template = {
                      id : '$.id',
                      event : '$.event.name',
                      name : '$.name',
                      image_16x9: '$.image_16x9',
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

                    //console.log(result);
                    var new_talk = new Talks(result);
                    new_talk.save(function(err) {
                         if (err)
                          console.log(err);
                    });
                  }
                });
                // get subtitle
                request.get(strformat(process.env.API_TED_TALK_SUB, {id: talkId}), function(req, res) {
                  if (typeof res !== "undefined" && typeof res.body !== "undefined") {
                      var captions = JSON.parse(res.body).captions;
                      console.log('3 === talkId.id = ' + talkId);
                      console.log('4 === captions = ' + captions.length);
                      //console.log(captions);
                      var sentences = [];
                      var startSen = 0, endSen = 0;
                      for (var i = 0; i < captions.length; i++) {
                        var cap = captions[i];
                        cap.content = cap.content.trim().replace('\n',' ');
                        if (checkEndsWithPeriod(cap.content, {periodMarks: [".","?","!", ".\"",";"]}).valid) {
                            endSen = i;
                            var sen;
                            if (endSen == startSen) {
                              sen = captions[endSen];
                              sen.words = Utils.parseSen(sen.content);

                            } else {

                              sen = {
                                'startTime' : 0,
                                'duration' : 0,
                                'content' : ''
                              };

                              if (startSen == 0) {
                                  startSen = -1;
                              }

                              sen.startTime = captions[startSen + 1].startTime
                              for (var j = startSen + 1 ; j <= endSen; j++) {
                                sen.content +=  captions[j].content + ' ';
                                sen.duration += captions[j].duration;
                              }
                              sen.content = sen.content.trim();
                              sen.words = Utils.parseSen(sen.content);
                              startSen = endSen;
                            }
                            sentences.push(sen);
                        }

                      }
                      var script = {
                        "talk_id" : talkId || 0,
                        "sens" : sentences

                      }
                      if (talkId > 0) {
                        var new_script = new Scripts(script);
                        new_script.save(function(err) {
                             if (err)
                              console.log(err);
                        });
                      }
                  }
                    //console.log(sentences);
                    //console.log('============================');
                });
              }
            });
          });
        }
      });
  }, null, true, process.env.TIME_ZONE);
};

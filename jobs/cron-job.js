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
    async = require('async'),
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
        async.eachSeries(talks, function iteratee(item, callback) {
          var talkObj = item.talk;
          var talkId = talkObj.id;
          var nativeLanguageCode = talkObj.native_language_code;
          Talks.findOne({ 'id': talkId }, function (err, talk) {
            if (talk === null) {
              console.log('cralwerTalkAndScript= ' + talkId);
              cralwerTalkAndScript(talkId, nativeLanguageCode).then(function (res) {
                callback();
              });
            } else if (talk !== null && !talk.has_sub) {
              console.log('update-cralwerScript= ' + talkId);
              cralwerScript(talkId, nativeLanguageCode).then(function (res) {
                callback();
              });
            }
          });
          console.log("============================================================");
        });
      }
    });
  }, null, true, process.env.TIME_ZONE);


  function cralwerTalkAndScript(talkId, nativeLanguageCode) {
    return new Promise(function (resolve, reject) {
      return cralwerTalk(talkId, nativeLanguageCode).then(function (res, err) {
        if (err) {
          reject(err);
        } else {
          cralwerScript(talkId, nativeLanguageCode).then(function (res, err) {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
          resolve(res);
        }
      })
    });
  }

  function cralwerTalk(talkId, nativeLanguageCode) {
    console.log(strformat(process.env.API_TED_TALK_DETAIL, { id: talkId }));
    return new Promise(function (resolve, reject) {
      request.get(strformat(process.env.API_TED_TALK_DETAIL, { id: talkId }), function (req, res) {
        if (typeof res !== "undefined" && typeof res.body !== "undefined" && res.body.length > 0) {
          var talkDetail = JSON.parse(res.body).talk;
          var template = {
            id: '$.id',
            event: '$.event.name',
            name: '$.name',
            description: '$.description',
            //image: '$..images[2]..url',
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

          var images = result.images;
          if (typeof images[1] !== "undefined") {
            result.image = images[1].url;
          } else if (typeof images[0] !== "undefined") {
            result.image = images[0].url;
          } else {
            result.image = result.image_16x9;
          }

          // if (typeof result.medias[1] !== "undefined") {
          //   result.media = result.medias[1].url;
          // } else 
          if (typeof result.medias[0] !== "undefined") {
            result.media = result.medias[0].url;
          }

          result.langs = [];
          for (var key in talkDetail.languages) {
            var obj = talkDetail.languages[key];
            result.langs.push({ 'code': key, 'name': obj.name });
          };

          // Truncate data again
          result.name = result.name.replace(result.speaker + ': ', '');

          //console.log(result);
          var new_talk = new Talks(result);
          new_talk.save(function (err) {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              resolve(new_talk);
            }
          });
        } else {
          reject(res);
        }
      });
    });
  }

  function cralwerScript(talkId, nativeLanguageCode) {
    console.log(strformat(process.env.API_TED_TALK_SUB_EN, { id: talkId }));
    return new Promise(function (resolve, reject) {
      request.get(strformat(process.env.API_TED_TALK_SUB_EN, { id: talkId }), function (req, res) {
        if (typeof res !== "undefined" && typeof res.body !== "undefined" && res.body.length > 0) {
          vttToJson(res.body).then(function (sens) {
            async.eachSeries(sens, function iteratee(sen, callback) {
              Utils.parseSen(sen.content).then(function (res, err) {
                sen.words = res;
                callback();
              });
            }, function () {

              var script = {
                "talk_id": talkId || 0,
                "lang": nativeLanguageCode,
                "sens": sens
              }
              var length = sens[sens.length - 1].end;
              if (talkId > 0) {
                var new_script = new Scripts(script);
                new_script.save(function (err) {
                  if (err) {
                    console.log(err);
                    resolve(err);
                  } else {
                    Talks.update({ id: talkId }, { $set: { has_sub: true, length: length } }, function (err, talk) {
                      if (err)
                        console.log(err);
                    });
                    resolve(new_script);
                  }
                });
              }

            });
          });
        } else {
          resolve(res);
        }

      });
    });
  }

};

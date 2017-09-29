'use strict';

exports.run = function () {
  //return new Promise(function(resolve, reject) {
    var request = require('request'),
      _ = require('lodash'),
      conf = require('dotenv').config(),
      mongoose = require('mongoose'),
      strformat = require('strformat'),
      transform = require('jsonpath-object-transform'),
      checkEndsWithPeriod = require("check-ends-with-period"),
      forEach = require('async-foreach').forEach,
      async = require('async'),

      Utils = require("../utils/utils.js"),
      Talks = mongoose.model('Talks'),
      Scripts = mongoose.model('Scripts');
    var limit = parseInt(process.env.LIMIT, 10);
    var total = 3000/limit;
    var offset = 0;

    async.eachSeries(_.range(total), function iteratee(i, callback) {
       offset = limit*i;
       console.log(" -i + Offset = " + offset);
       crawlerTalks(offset).then(function(res) {
            console.log('=========== OK continue to nex offset ===============');
            callback();
        });
    });

    function crawlerTalks(offset) {
      console.log(" - crawlerTalks Offset = " + offset);
      return new Promise(function(resolve, reject) {
        request.get(strformat(process.env.API_TED_TALK_ALL, {limit: limit, offset: offset}), function(req, res) {
          if (typeof res !== "undefined" && typeof res.body !== "undefined") {
            var result = JSON.parse(res.body);
            if (result.counts.this >0) {
              var talks = result.talks;
              forEach(talks, function(item, index) {
                var talkObj = item.talk;
                console.log("talkId = " + talkObj.id);
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

                        var new_talk = new Talks(result);
                        new_talk.save(function(err) {
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
                  } else {
                    reject(res);
                  }
                });
              });
            } else {
              reject(res);
            }
          } else {
            reject(res);
          }
        });

      });
    }

  //});
};

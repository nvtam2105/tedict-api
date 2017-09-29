'use strict';

exports.run = function () {
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


    // get all news talks
    var limit = parseInt(process.env.LIMIT, 10);
    var total = 3000/limit;
    var offset = 0;
    async.eachSeries(_.range(total), function iteratee(i, callback) {
       offset = limit*i;
       crawlerScripts(offset).then(function(res) {
            console.log('=========== OK continue to nex offset ===============');
            callback();
        });
    });

    function crawlerScripts(offset) {
      console.log(" - crawlerScripts Offset = " + offset);
      return new Promise(function(resolve, reject) {
        request.get(strformat(process.env.API_TED_TALK_ALL, {limit: limit, offset: offset}), function(req, res) {
          if (typeof res !== "undefined" && typeof res.body !== "undefined") {
            var result = JSON.parse(res.body);
            if (result.counts.this >0) {
              var talks = result.talks;
              forEach(talks, function(item, index) {
                var talkObj = item.talk;
                //console.log(" - Scripts talkId = " + talkObj.id);
                Talks.findOne({ 'id': talkObj.id }, function(err, talk) {
                  if (talk == null) {
                    var talkId = talkObj.id;
                    request.get(strformat(process.env.API_TED_TALK_SUB, {id: talkId}), function(req, res) {
                      if (typeof res !== "undefined" && typeof res.body !== "undefined") {
                          var captions = JSON.parse(res.body).captions;
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
                                  reject(err);
                                  else {
                                    resolve(new_script);
                                  }
                            });
                          }
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

};

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
    vttToJson = require("../utils/vtt-to-json"),
    Utils = require("../utils/utils.js"),
    //Talks = mongoose.model('Talks'),
    Scripts = mongoose.model('Scripts');

  // get all news talks
  var limit = parseInt(process.env.LIMIT, 10);
  var total = 3000 / limit;
  var offset = 0;
  async.eachSeries(_.range(total), function iteratee(i, callback) {
    offset = limit * i;
    crawlerScripts(offset).then(function (res) {
      console.log('=========== OK continue to nex offset ===============');
      callback();
    });
  });

  function crawlerScripts(offset) {
    console.log(" - crawlerScripts Offset = " + offset);
    return new Promise(function (resolve, reject) {
      request.get(strformat(process.env.API_TED_TALK_ALL, { limit: limit, offset: offset }), function (req, res) {
        if (typeof res !== "undefined" && typeof res.body !== "undefined" && res.body.length > 0) {
          var result = JSON.parse(res.body);
          if (result.counts.this > 0) {
            var talks = result.talks;
            forEach(talks, function (item, index) {
              var talkObj = item.talk;
              var talkId = talkObj.id;
              console.log(" - Scripts talkId = " + talkObj.id);
              Scripts.findOne({ 'talk_id': talkObj.id }, function (err, script) {
                if (script == null) {
                  request.get(strformat(process.env.API_TED_TALK_SUB, { id: talkId }), function (req, res) {
                    if (typeof res !== "undefined" && typeof res.body !== "undefined" && res.body.length > 0) {
                      var sens = vttToJson(res.body).then(function (sens) {
                        var script = {
                          "talk_id": talkId || 0,
                          "sens": sens
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
                      });
                    }
                  });
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

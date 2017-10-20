'use strict';

exports.parseSen = function (sen) {
  var result = [];
  var empty = require('is-empty'),
      checkEndsWithPeriod = require("check-ends-with-period");
  var words = empty(sen) ? [] : sen.split(" ");

  for (var w in words) {
    if (!empty(words[w])) {
      var text = words[w].trim().replace("\"", "").replace("\'", "");
      if (checkEndsWithPeriod(text, { periodMarks: [".", "?", "!", ","] }).valid) {
        text = text.substring(0, text.length - 1)
      } else if (checkEndsWithPeriod(text, { periodMarks: [".\"", ".\'", "!\"", "?\"", "!\'", "?\'"] }).valid) {
        text = text.substring(0, text.length - 2)
      }
      
      result.push({ 'text': words[w], 'length': text.length });
    }
  }
  return result;
}

exports.parseSenAndGetType = function (sen) {
  return new Promise(function (resolve, reject) {
    var async = require('async'),
      empty = require('is-empty'),

      results = [],
      words = empty(sen) ? [] : sen.split(" ");
    var checkEndsWithPeriod = require("check-ends-with-period");

    async.eachSeries(words, function iteratee(word, callback) {
      var text = word.trim().replace("\"", "").replace("\'", "");
      if (checkEndsWithPeriod(text, { periodMarks: [".", "?", "!", ","] }).valid) {
        text = text.substring(0, text.length - 1)
      } else if (checkEndsWithPeriod(text, { periodMarks: [".\"", ".\'", "!\"", "?\"", "!\'", "?\'"] }).valid) {
        text = text.substring(0, text.length - 2)
      }

      getTypeWord(text).then(function (res, err) {
        if (res) {
          results.push({ 'text': word, 'type': res });
          callback();
        }

      });
    }, function () {
      resolve(results);
    });

  });
};

function getTypeWord(text) {
  var WordPOS = require('wordpos'),
    wordpos = new WordPOS();
  return new Promise(function (resolve, reject) {
    wordpos.isNoun(text, function (res) {
      if (res) {
        resolve("N");
      } else {
        wordpos.isVerb(text, function (res) {
          if (res) {
            resolve("V");
          } else {
            wordpos.isAdjective(text, function (res) {
              if (res) {
                resolve("Adj");
              } else {
                wordpos.isAdverb(text, function (res) {
                  if (res) {
                    resolve("Adv");
                  } else {
                    resolve("NA");
                  }
                });
              }
            });
          }
        });
      }
    });
  });
};

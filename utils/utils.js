'use strict';

exports.parseSen = function (sen) {
  return new Promise(function (resolve, reject) {
    var async = require('async'),
      empty = require('is-empty'),
      results = [],
      words = empty(sen) ? [] : sen.split(" ");

    async.eachSeries(words, function iteratee(word, callback) {
      getTypeWord(word).then(function (res, err) {
        if (res) {
          console.log("111");
          results.push({ 'text': word, 'type': res });
          callback();
        }

      });
    }, function () {
      console.log("222");
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

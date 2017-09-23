'use strict';

exports.parseSen = function(sen) {
  var empty = require('is-empty'),
      result = [],
      words = empty(sen) ? [] : sen.split(" ");

  for (var w in words) {
    console.log(words[w]);
    result.push({'text' : words[w]});
  }
  return result;
};

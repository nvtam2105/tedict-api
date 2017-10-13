function convertVttToJson(vttString) {
  return new Promise((resolve, reject) => {
    var checkEndsWithPeriod = require("check-ends-with-period"),
      empty = require('is-empty'),
      Utils = require("../utils/utils.js");
    var current = {}
    var sections = []
    var start = false;
    var vttArray = vttString.split('\n');
    vttArray.forEach((line, index) => {
      if (line.indexOf('-->') !== -1) { // get start time and end time
        start = true
        current = {
          start: timeString2ms(line.split("-->")[0].trimRight().split(" ").pop()),
          end: timeString2ms(line.split("-->")[1].trimLeft().split(" ").shift()),
          content: ''
        }
      } else if (empty(line)) {
        if (start) {
          sections.push(clone(current))
          start = false
        }
      } else {
        if (start) {
          current.content += ' ' + line
        }
      }
    })

    // combine to sen
    var sentences = [];
    var startSen = 0, endSen = 0;
    sections.forEach((section, index) => {
      if (checkEndsWithPeriod(section.content, {
            periodMarks: [".", "?", "!", ".\"",".\'", "!\"", "?\"", "!\'", "?\'"] }).valid) {
        var sen;
        endSen = index;
        if (endSen == startSen) {
          sen = sections[endSen]
          startSen = index

        } else {
          sen = {
            'start': 0,
            'end': 0,
            'content': ''
          };

          if (startSen === 0) {
            startSen = -1
          }
          sen.start = sections[startSen + 1].start;

          for (var j = startSen + 1; j <= endSen; j++) {
            sen.content += sections[j].content.trim() + ' ';
            sen.end = sections[j].end;
          }
          sen.content = sen.content.trim();
          sen.words = Utils.parseSen(sen.content);
          startSen = endSen;

        }
        sentences.push(sen)
      }
    })

    resolve(sentences);
  })
}

// helpers
// http://codereview.stackexchange.com/questions/45335/milliseconds-to-time-string-time-string-to-milliseconds
function timeString2ms(a, b) {// time(HH:MM:SS.mss) // optimized
  return a = a.split('.'), // optimized
    b = a[1] * 1 || 0, // optimized
    a = a[0].split(':'),
    b + (a[2] ? a[0] * 3600 + a[1] * 60 + a[2] * 1 : a[1] ? a[0] * 60 + a[1] * 1 : a[0] * 1) * 1e3 // optimized
}

// removes everything but characters and apostrophe and dash
function cleanWord(word) {
  return word.replace(/[^0-9a-z'-]/gi, '').toLowerCase()
}

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

module.exports = convertVttToJson;

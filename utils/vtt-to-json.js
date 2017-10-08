function convertVttToJson(vttString) {
  return new Promise((resolve, reject) => {
    var checkEndsWithPeriod = require("check-ends-with-period"),
        Utils = require("../utils/utils.js");
    var current = {}
    var sections = []
    var start = false;
    var vttArray = vttString.split('\n');
    vttArray.forEach((line, index) => {
      if (line.replace(/<\/?[^>]+(>|$)/g, "") === " ") {
      } else if (line.replace(/<\/?[^>]+(>|$)/g, "") == "") {
      } else if (line.indexOf('-->') !== -1) {
        start = true;

        if (current.start) {
          sections.push(clone(current))
        }

        current = {
          start: timeString2ms(line.split("-->")[0].trimRight().split(" ").pop()),
          end: timeString2ms(line.split("-->")[1].trimLeft().split(" ").shift()),
          content: ''
        }
      } else if (line.replace(/<\/?[^>]+(>|$)/g, "") === "") {
      } else if (line.replace(/<\/?[^>]+(>|$)/g, "") === " ") {
      } else {
        if (start) {
          if (sections.length !== 0) {
            if (sections[sections.length - 1].content.replace(/<\/?[^>]+(>|$)/g, "") === line.replace(/<\/?[^>]+(>|$)/g, "")) {
            } else {
              if (current.content.length === 0) {
                current.content = line
              } else {
                current.content = `${current.content}`
              }
              // If it's the last line of the subtitles
              if (index === vttArray.length - 1) {
                sections.push(clone(current))
              }
            }
          } else {
            current.content = line
            sections.push(clone(current))
            current.content = ''
          }
        }
      }
    })

    current = []

    // slipt line to words
    var regex = /(<([0-9:.>]+)>)/ig
    sections.forEach(section => {
      strs = section.content.split()
      var results = strs.map(function (s) {
        return s.replace(regex, function (n) {
          return n.split('').reduce(function (s, i) { return `==${n.replace("<", "").replace(">", "")}` }, 0)
        })
      });

      // building words
      // cleanText = results[0].replace(/<\/?[^>]+(>|$)/g, "");
      // cleanArray = cleanText.split(" ")
      // resultsArray = [];
      // cleanArray.forEach(function (item) {
      //   if (item.indexOf('==') > -1) {
      //     var pair = item.split("==")
      //     var key = pair[0]
      //     var value = pair[1]
      //     if (key == "" || key == "##") {
      //       return;
      //     }
      //     resultsArray.push({
      //       word: cleanWord(item.split("==")[0]),
      //       time: timeString2ms(item.split("==")[1]),
      //     })
      //   } else {
      //     resultsArray.push({
      //       text: cleanWord(item),
      //       //time: undefined,
      //     })
      //   }
      // })

      // section.words = resultsArray;
      section.content = section.content.replace(/<\/?[^>]+(>|$)/g, "")
    })

    // combine to sen
    var sentences = [];
    var startSen = 0, endSen = 0;
    sections.forEach((section, index) => {
      //console.log(section.content);
      if (checkEndsWithPeriod(section.content, { periodMarks: [".", "?", "!", ".\"", ";"] }).valid) {
        
        var sen;
        endSen = index;
        if (endSen == startSen) {
          sen = sections[endSen];

        } else {
          sen = {
            'start': 0,
            'end': 0,
            'content': ''
          };

          if (startSen == 0) {
            startSen = -1;
          }

          sen.start = sections[startSen + 1].start;

          for (var j = startSen + 1; j <= endSen; j++) {
            sen.content += sections[j].content + ' ';
            sen.end = sections[j].end;
          }
          sen.content = sen.content.trim();
          sen.words = Utils.parseSen(sen.content);
          startSen = endSen;

        }
        sentences.push(sen);
      }
    })

    resolve(sections);
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

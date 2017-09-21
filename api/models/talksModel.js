
'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// "id": 2863,
// "event_id": 455,
// "name": "Laolu Senbanjo: \"The Sacred Art of the Ori\"",
// "description": "Every artist has a name, and every artist has a story. Laolu Senbanjo's story started in Nigeria, where he was surrounded by the culture and mythology of the Yoruba, and brought him to law school, to New York and eventually to work on Beyoncé's \"Lemonade.\" He shares what he calls \"The Sacred Art of the Ori,\" art that uses skin as canvas and connects artist and muse through mind, body and soul.",
// "slug": "laolu_senbanjo_the_sacred_art_of_the_ori",
// "native_language_code": "en",
// "published_at": "2017-08-25 14:57:57",
// "recorded_at": "2017-04-24 00:00:00",
// "updated_at": "2017-09-14 10:21:40",
// "released_at": "2017-08-25 14:58:04"

var TalksSchema = new Schema({
  id: {
    type: Number
  },
  event_id: {
    type: Number
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  slug: {
    type: String
  },
  native_language_code: {
    type: String
  },
  published_at: {
    type: Date
  },
  recorded_at: {
    type: Date
  },
  updated_at: {
    type: Date
  },
  released_at: {
    type: Date
  }
});

module.exports = mongoose.model('Talks', TalksSchema);

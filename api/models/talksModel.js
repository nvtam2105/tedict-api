'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TalksSchema = new Schema({
  id: {type: Number},
  event: {type: String},
  name: {type: String},
  description: {type: String},
  slug: {type: String},
  native_language_code: {type: String},
  published_at: {type: Date},
  recorded_at: {type: Date},
  updated_at: {type: Date},
  viewed_count: {type: Number},
  image_16x9: {type: String},
  images: [{size: String, url: String}],
  speakers: [{name: String}],
  tags: [{name: String}],
  medias: [{name: String, url: String, size: Number, mime_type: String}],
  langs: [{code: String, name: String}]
});

module.exports = mongoose.model('Talks', TalksSchema);

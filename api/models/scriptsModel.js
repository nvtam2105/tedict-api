'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ScriptsSchema = new Schema({
  talk_id: { type: Number },
  lang: { type: String },
  sens: [{
    start: Number,
    end: Number,
    content: String,
    words: [{ text: String, type: { type: String, default: 'NA' } }]
  }]
});

module.exports = mongoose.model('Scripts', ScriptsSchema);

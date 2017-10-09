'use strict';
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ScriptsSchema = new Schema({
  talk_id: {type: Number},
  sens: [{
      start: Number,
      end: Number,
      content: String,
      words: [{text: String}]
    }]
});

module.exports = mongoose.model('Scripts', ScriptsSchema);

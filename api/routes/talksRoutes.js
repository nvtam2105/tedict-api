'use strict';
module.exports = function(app) {
  var talks = require('../controllers/talksController'),
      scripts = require('../controllers/scriptsController');

  app.route('/talks')
    .get(talks.list_all_talks)
    .post(talks.create_a_talk);

  app.route('/talks/:talkId')
    .get(talks.read_a_talk);

  app.route('/scripts/:talkId')
    .get(scripts.get_scripts_of_talk);
};

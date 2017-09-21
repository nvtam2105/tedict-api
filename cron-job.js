var cron = require('cron'),
    request = require('request'),
    talks = require('./controllers/talksController');


new CronJob('* * * * * *', function() {
      //console.log('You will see this message every second');
      //https://api.ted.com/v1/talks.json?api-key=2a9uggd876y5qua7ydghfzrq&order=created_at:desc&limit=5
      request.get('api', function(req, res){
        //res.counts {
          // this:
          // total
        //}
        //res.talks
        
        talks.create_a_talk(req,res);
      });



}, null, true, 'America/Los_Angeles');

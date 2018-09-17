// library imports
const schedule = require('node-schedule')

// project imports
const checkMaxHeroes = require('./check-max-heroes')

// this won't export anything because it's simply a setup that we need to run to set up the cron jobs
schedule.scheduleJob('0 0 * * 1-5', function (firedate) {
  console.log('running max heroes query on ' + firedate)
  checkMaxHeroes()
    .catch((err) => {
      console.error(err)
    })
})
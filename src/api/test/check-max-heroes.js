// project imports
const maxHeroesCheck = require('./../../cron/check-max-heroes')

module.exports = function(req, res, next) {
  maxHeroesCheck()
    .then(() => {
      return res.status(200).send()
    })
    .catch(err => {
      next(err)
    })
}

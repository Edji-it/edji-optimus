// project imports
const maxHeroesCheck = require('./../../cron/check-max-heroes')

module.exports = function (req, res) {
  maxHeroesCheck()
    .then(() => {
      return res.status(200).send()
    })
    .catch((err) => {
      console.error(err)
      return res.status(500).send({ error: err })
    })
}
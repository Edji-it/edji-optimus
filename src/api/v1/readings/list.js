// library imports
const joi = require('joi')

// project imports
const helpers = require('./_list')
const ReadingVersion = require('./../../../models/ReadingVersion')

module.exports = function(req, res) {
  const user = req.user
  const query = helpers.validateQuery(req.query)
  if (query.error) {
      return res.status(400).send({ error: query.error })
  }

  let dbQuery
  if (query.value.pop.indexOf("projects") > -1) {
    dbQuery = ReadingVersion.aggregate(helpers.populateProjectAggregation(user._id))
  } else {
    dbQuery = ReadingVersion.aggregate(helpers.baseAggregation(user._id))
  }

  dbQuery.then((readings) => {
    return res.status(200).send(readings)
  })
  .catch((err) => {
    console.error
    return res.status(500).send()
  })
}
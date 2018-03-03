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
  let aggregation
  if (query.value.pop.indexOf("projects") > -1) {
    aggregation = helpers.populateProjectAggregation(user._id)
    aggregation = helpers.paginate(aggregation, 0, 10)
    dbQuery = ReadingVersion.aggregate(aggregation)
  } else {
    dbQuery = ReadingVersion.aggregate(helpers.baseAggregation(user._id))
  }

  dbQuery.then((results) => {
    results = results[0] // because it's an aggregation, they come back in an array so we take the first element
    return res.status(200).send({
      readings: results.readings,
      total: results.total
    })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}
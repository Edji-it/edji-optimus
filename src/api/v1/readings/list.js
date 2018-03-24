// library imports
const Q = require('q')

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
    aggregation = helpers.paginate(
      helpers.populateProjectAggregation(user._id),
      query.value.start,
      query.value.size
    )
    // it is assumed that we will always be starting with ReadingVersion on this endpoint, so that we can easily filter for the most recent
    dbQuery = Q(ReadingVersion.aggregate(aggregation))
  } else {
    aggregation = helpers.paginate(
      helpers.baseAggregation(user._id),
      query.value.start,
      query.value.size
    )
    dbQuery = Q(ReadingVersion.aggregate(aggregation))
  }

  dbQuery.then((results) => {
    if (results && results[0]) {
      results = results[0] // because it's an aggregation, they come back in an array so we take the first element
    }

    let readings = results.readings || []
    return res.status(200).send({
      readings: readings,
      total: results.total
    })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}
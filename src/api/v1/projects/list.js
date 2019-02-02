// library imports

// project imports
const Project = require('./../../../models/Project')
const helpers = require('./_list')
const _agg = require('./../../../aggregations')

module.exports = function (req, res, next) {
  const user = req.user
  const query = helpers.validateQuery(req.query)
  if (query.error) {
    return res.status(400).send({ error: query.error })
  }

  let aggregation = helpers.baseAggregation(user)

  // populate the reading if it is requested
  if (query.value.pop.indexOf('reading') > -1) {
    aggregation = aggregation.concat(helpers.populateReadings)
  }

  if (query.value.pop.indexOf('teacher') > -1) {
    aggregation = aggregation.concat(helpers.populateTeachers)
  }

  aggregation.push({ $project: helpers.responseShape }) // filter down to only the properties which we want to return

  aggregation = _agg.paginateAggregation(aggregation, { createdAt: -1 }, query.value.start, query.value.size) // paginate the results

  // run the query
  Project.aggregate(aggregation)
    .then((response) => {
      if (response[0]) { response = response[0] }
      else { response = { total: 0, results: [] } }

      return res.status(200).send({ total: response.total, projects: response.results })
    })
    .catch((err) => {
      next(err)
    })
}
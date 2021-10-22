// library imports

// project imports
import Module from '../../../models/Module'
import { validateQuery, baseAggregation, populateReadings, populateTeachers, responseShape } from './_list'
import { paginateAggregation } from './../../../aggregations'

module.exports = function(req, res, next) {
  const user = req.user
  const query = validateQuery(req.query)
  if (query.error) {
    return res.status(400).send({ error: query.error })
  }

  let aggregation = baseAggregation(user)

  // populate the reading if it is requested
  if (query.value.pop.indexOf('reading') > -1) {
    aggregation = aggregation.concat(populateReadings)
  }

  if (query.value.pop.indexOf('teacher') > -1) {
    aggregation = aggregation.concat(populateTeachers)
  }

  aggregation.push({ $project: responseShape }) // filter down to only the properties which we want to return

  aggregation = paginateAggregation(aggregation, { createdAt: -1 }, query.value.start, query.value.size) // paginate the results

  // run the query
  Module.aggregate(aggregation)
    .then(response => {
      if (response[0]) {
        response = response[0]
      } else {
        response = { total: 0, results: [] }
      }

      return res.status(200).send({ total: response.total, modules: response.results })
    })
    .catch(err => {
      next(err)
    })
}

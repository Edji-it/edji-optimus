// library imports
const Q = require('q')

// project imports
const Project = require('./../../../models/Project')
const helpers = require('./_list')
const db = require('./../../../_db')

module.exports = function(req, res) {
  const user = req.user
  const query = helpers.validateQuery(req.query)
  if (query.error) {
    return res.status(400).send({ error: query.error })
  }

  let aggregation = helpers.baseAggregation(user)

  // populate the reading if it is requested
  if (query.value.pop.indexOf('reading') > -1) {
    aggregation = aggregation.concat(helpers.populateReadings)
    console.log('asked for reading')
  }
  
  if (query.value.pop.indexOf('teacher') > -1) {
    aggregation = aggregation.concat(helpers.populateTeachers)
  }

  aggregation.push({ $project: helpers.responseShape }) // filter down to only the properties which we want to return

  aggregation = db.paginateAggregation(aggregation, query.value.start, query.value.size) // paginate the results

  // run the query
  Q(Project.aggregate(aggregation))
  .then((response) => {
    response = response[0]
    return res.status(200).send({ total: response.total, projects: response.results })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}
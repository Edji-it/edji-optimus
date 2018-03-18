// library imports
const Q = require('q')

// project imports
const Project = require('./../../../models/Project')
const helpers = require('./_list')

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

  // // set up initial query
  // let dbQuery = Project.find(
  //   helpers.baseQuery(user),
  //   'reading_id teacher_id label code types tags updatedAt createdAt',
  //   { sort: { createdAt: -1 } }
  // )

  // // add population values
  // if (query.value.pop.indexOf('teacher') > -1) {
  //   dbQuery.populate('teacher', 'fullname email username')
  // }
  // if (query.value.pop.indexOf('reading') > -1) {
  //   dbQuery.populate('reading', 'title')
  // }

  aggregation.push({ $sort: { createdAt: -1 } })

  // run the query
  Q(Project.aggregate(aggregation).exec())
  .then((projects) => {
    return res.status(200).send({ projects: projects })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}
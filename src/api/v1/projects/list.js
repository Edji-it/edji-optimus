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

  // set up initial query
  let dbQuery = Project.find(
    helpers.baseQuery(user),
    'reading_id teacher_id label code types tags updatedAt createdAt',
    { sort: { createdAt: -1 } }
  )

  // add population values
  if (query.value.pop.indexOf('teacher') > -1) {
    dbQuery.populate('teacher', 'fullname email username')
  }
  if (query.value.pop.indexOf('reading') > -1) {
    dbQuery.populate('reading', 'title')
  }

  // run the query
  Q(dbQuery).then((projects) => {

    // if reading was populated, make sure that only projects with readings are returned
    if (query.value.pop.indexOf('reading') > -1) {
      projects = projects.filter((project) => {
        return !!project.reading
      })
    }
    return res.status(200).send({ projects: projects })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}
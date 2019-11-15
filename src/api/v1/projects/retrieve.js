// library imports
const mongoose = require('mongoose')

// project imports
const Project = require('./../../../models/Project').default
const helpers = require('./_retrieve')
const Sentry = require('@sentry/node')

module.exports = async function(req, res, next) {
  let user = req.user
  const project_id = req.params.project_id
  let population = req.query.pop || []
  if (typeof population == 'string') {
    // otherwise it's going to be an array of strings, which is what we want
    population = [population]
  }
  let findParams = {}

  //creates flexibility to use with either project code or with project id
  if (mongoose.validateEdjiId(project_id)) {
    findParams._id = mongoose.Types.ObjectId(project_id)
  } else {
    findParams.code = project_id.toLowerCase()
  }

  let pipeline = [{ $match: findParams }]

  pipeline = pipeline.concat(helpers.populateProperties(population))

  try {
    let projects = await Project.aggregate(pipeline)
    // return 404 if project was not found
    if (!projects || projects.length < 1) {
      return res.status(404).send()
    }
    // aggregate returns as an array, we need this to just be the set of properties
    let project = projects[0]
    // clear out the properties that we don't need
    /** @todo remove these in the projection to save the time/memory of sending them back to optimus */
    delete project.teacherRef
    delete project.reading
    let { update } = await helpers.addIdToProject(user, project)
    if (update) {
      let updatedNum = await Project.updateOne({ _id: project._id }, update)
      if (!updatedNum.nModified) {
        Sentry.captureException(new Error(`user: ${user._id} not added to project: ${project._id} upon update attempt`))
      }
      // if the user was added to arrays, log this to pipo for stats tracking
      helpers.logJoinToPipo(user, project)
    }

    // some properties needs to be added to the project before sending it
    helpers.decorateProject(project)
    // send back the project
    return res.status(200).send({ project: project })
  } catch (err) {
    return next(err)
  }
}

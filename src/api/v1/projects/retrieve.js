// library imports
const Q = require('q')
let mongoose = require("mongoose")

// project imports
const Project = require('./../../../models/Project')
const helpers = require('./_retrieve')

module.exports = function (req, res) {
  let user = req.user
  const project_id = req.params.project_id
  let population = req.query.pop || []
  if (typeof population == 'string') { // otherwise it's going to be an array of strings, which is what we want
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

  Project
    .aggregate(pipeline)
    .exec()
    .then((project) => {
      // if project is null (meaning it did not exist in the collection)
      if (!project || project.length < 1) {
        return res.status(404).send()
      }
      // aggregate returns as an array, we need this to just be the set of properties
      project = project[0]
      // clear out the properties that we don't need
      delete project.teacherRef
      delete project.reading

      // return helpers.addIdToProject(user, project)
      let { update } = helpers.addIdToProject(user, project)
      if (update) {
        return Project.update(
          { _id: project._id },
          update
        )
          .then((result) => {
            if (!result.nModified) {
              console.error('user not added to project upon update attempt')
            }
            return { project, updated: true }
          })
      } else {
        return { project }
      }
    })
    .then(({ project, updated }) => {
      // some properties needs to be added to the project before sending it
      helpers.decorateProject(project)
      // send back the project
      res.status(200).send({ project: project })

      // if the user was added to arrays, log this to pipo
      updated && helpers.logJoinToPipo(user, project)
    })
    .catch((error) => {
      console.error(error)
      return res.status(500).send()
    })
}
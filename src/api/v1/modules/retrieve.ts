// library imports
const mongoose = require('mongoose')

// Module imports
import Module from '../../../models/Module'
import { populateProperties } from './_retrieve'

module.exports = async function(req, res, next) {
  let user = req.user
  const module_id = req.params.module_id
  let population = req.query.pop || []
  if (typeof population == 'string') {
    // otherwise it's going to be an array of strings, which is what we want
    population = [population]
  }
  let findParams: any = {}

  //creates flexibility to use with either module code or with module id
  if (mongoose.validateEdjiId(module_id)) {
    findParams._id = mongoose.Types.ObjectId(module_id)
  }

  let pipeline = [{ $match: findParams }]

  pipeline = pipeline.concat(populateProperties(population))

  try {
    let modules = await Module.aggregate(pipeline)
    // return 404 if module was not found
    if (!modules || modules.length < 1) {
      return res.status(404).send()
    }

    let module = modules[0]
    // TODO: Check for students
    if (!module.teacher_id === user._id && !module.co_owner_ids.includes(user._id)) {
      return res.status(401).send()
    }

    // send back the module
    return res.status(200).send(module)
  } catch (err) {
    return next(err)
  }
}

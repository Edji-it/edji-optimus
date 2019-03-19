// library imports
import { RequestHandler } from 'express'

// project imports
import * as Project from './../../../models/Project'

const validateHandler: RequestHandler = async function (req, res, next) {
  if (!req.params.project_code) {
    return res.status(400).send({ error: 'no project_code provided' })
  }
  try {
    const project_code = req.params.project_code.toLowerCase()
    const project = await Project.findOne({ code: project_code }, '_id')
    if (project) {
      return res.status(200).send({ found: true, _id: project._id })
    } else {
      return res.status(200).send({ found: false })
    }
  } catch (err) {
    return next(err)
  }
}

export default validateHandler
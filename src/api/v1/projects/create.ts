// library imports
import { Request, Response, NextFunction } from 'express'

// project imports
import * as Project from './../../../models/Project'
import { cleanMongoValidationError } from './../../../error-handlers/mongo-validation'

export default async function CreateProjectController(req: Request, res: Response, next: NextFunction) {
  let projectData = req.body.project

  if (!projectData) {
    res.status(400).send({ validationErrors: { project: "required" } })
    return
  }

  // if a specific id isn't passed, go ahead and set it as the creating user's id
  if (!projectData.teacher_id) {
    projectData.teacher_id = req.user._id
  }

  try {
    let project = await new Project(projectData).edjiSave()
    res.status(201).send({ project })
  } catch (err) {
    if (err.name === "ValidationError") {
      let validationErrors = cleanMongoValidationError(err)
      return res.status(406).send({ validationErrors })
    }
    return next(err)
  }
}
// library imports
import { Request, Response, NextFunction } from 'express'

// project imports
import * as Project from './../../../models/Project'
import * as SessionCode from './../../../models/SessionCode'
import { cleanMongoValidationError } from './../../../error-handlers/mongo-validation'

export default async function CreateProjectController(req: Request, res: Response, next: NextFunction) {
  let projectData = req.body

  // if a specific id isn't passed, go ahead and set it as the creating user's id
  if (!projectData.teacher_id) {
    projectData.teacher_id = req.user._id
  }

  try {
    const hasCustomCode = projectData.code ? true : false
    let project = await new Project(projectData).edjiSave()

    // just in case a Hero has chosen a custom code which exists in the database
    if (hasCustomCode) {
      await SessionCode.updateOne(
        { code: projectData.code },
        { $set: { active: true } }
      )
    }
    /**
     * @deprecated 2/2/19
     */
    if (req.params.wrap_response) {
      project = { project }
    }
    res.status(201).send(project)
  } catch (err) {
    if (err.name === "ValidationError") {
      let validationErrors = cleanMongoValidationError(err)
      return res.status(406).send({ validationErrors })
    }
    return next(err)
  }
}
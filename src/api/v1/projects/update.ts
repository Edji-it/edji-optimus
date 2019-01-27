// library imports
import { Request, Response, NextFunction } from 'express'
import { pick } from 'underscore'

// project imports
import * as Project from '../../../models/Project'
import { cleanMongoValidationError } from '../../../error-handlers/mongo-validation'

export async function UpdateProjectController(req: Request, res: Response, next: NextFunction) {
  try {
    const PROJECT_ID = req.params.project_id
    let user = req.user
    let updateData: any = req.body
    if (!updateData) {
      return res.status(400).send({ error: 'no project passed' })
    }

    const propertiesToUpdate: any = pick(updateData, SIMPLY_UPDATABLE_PROPERTIES)
    const attemptedUpdateProperties: string[] = Object.keys(propertiesToUpdate)
    if (attemptedUpdateProperties.length === 0) {
      return res.status(400).send({ error: 'no valid update properties in project body' })
    }
    let project = await Project.findOneAndUpdate(
      {
        _id: PROJECT_ID,
        teacher_id: user._id
      },
      propertiesToUpdate,
      {
        new: true,
        runValidators: true
      }
    )
    if (!project) {
      return res.status(404).send({ error: 'no project at that id' })
    }
    const updated = pick(project, attemptedUpdateProperties)
    return res.status(200).send(updated)
  } catch (err) {
    if (err.name === "ValidationError") {
      let validationErrors = cleanMongoValidationError(err)
      return res.status(406).send({ validationErrors })
    }
    return next(err)
  }
}

export async function UpdatePropertyController(req: Request, res: Response, next: NextFunction) {
  let { update_property } = req.params
  let update = req.body

  if (!UPDATABLE_PROPERTIES.includes(update_property)) {
    return res.status(400).send({ error: 'requested update of a property which could not be updated' })
  }
}

const UPDATE_CONTROLLERS: { [key: string]: (update: any) => void } = {
  comment: function (comment) {

  }
}

const UPDATABLE_PROPERTIES: string[] = Object.keys(UPDATE_CONTROLLERS)

const SIMPLY_UPDATABLE_PROPERTIES: string[] = ['heat_vision', 'tags', 'report_evals']
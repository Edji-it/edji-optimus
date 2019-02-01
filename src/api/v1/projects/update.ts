// library imports
import { Request, Response, NextFunction } from 'express'
import * as mongoose from 'mongoose'
import { pick } from 'underscore'
import { ObjectId } from 'mongodb'

// project imports
import * as Project from '../../../models/Project'
import { cleanMongoValidationError } from '../../../error-handlers/mongo-validation'
import { updateCommentArray } from './_update'

export async function UpdateProjectController(req: Request, res: Response, next: NextFunction) {
  try {
    const { project_id } = req.params
    let user = req.user
    let updateData: any = req.body

    // I couldn't figure out how to get typescript to allow me to call `validateEdjiId` on mongoose because it doesn't exist in mongoose types
    if (!mongoose['validateEdjiId'](project_id)) {
      return res.status(400).send({ error: 'invalid project id passed' })
    }

    const propertiesToUpdate: any = pick(updateData, SIMPLY_UPDATABLE_PROPERTIES)
    const attemptedUpdateProperties: string[] = Object.keys(propertiesToUpdate)
    if (attemptedUpdateProperties.length === 0) {
      return res.status(400).send({ error: 'no valid update properties in project body' })
    }
    let project = await Project.findOneAndUpdate(
      {
        _id: project_id,
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
  try {
    // project_id and update_property are required by express routing
    const { project_id, update_property } = req.params
    const { user } = req
    const update: any = req.body

    if (!mongoose['validateEdjiId'](project_id)) {
      return res.status(400).send({ error: 'invalid project or property id passed' })
    }

    if (!CUSTOM_UPDATABLE_PROPERTIES.includes(update_property)) {
      return res.status(400).send({ error: 'requested update of a property which could not be updated' })
    }

    const updateObj = await UPDATE_CONTROLLERS[update_property]({ project_id, user, update })
    return res.status(200).send(updateObj)
  } catch (err) {
    if (err.name === 'ValidationError') {
      let validationErrors = cleanMongoValidationError(err)
      return res.status(406).send({ validationErrors })
    } else if (err.message === 'err_no_project') {
      return res.status(404).send({ error: 'no project found for that id' })
    } else if (err.message === 'err_not_authorized') {
      return res.status(403).send()
    } else if (err.status) {
      return res.status(err.status).send({ error: err.message })
    }
    return next(err)
  }
}

const UPDATE_CONTROLLERS: {
  [key: string]: (props: { project_id: string, user: any, update: any }) => Promise<any>
} = {
  comments: function (props) {
    return updateCommentArray(props, 'comments')
  },
  answers: function (props) {
    return updateCommentArray(props, 'answers')
  },
  students: async function ({ project_id, user, update }) {
    if (!update || !update._id) {
      let err = new Error('no _id supplied to add to students')
      err['status'] = 400
    }
    const studentsArray: string = (user.type && user.type === 'temp') ? 'temp_ids' : 'students_ids'
    const res = await Project.update(
      {
        _id: project_id,
        teacher_id: { $not: { $eq: user._id } } // don't add a project owner to their own project as a student
      },
      {
        $addToSet: {
          [studentsArray]: user._id
        }
      },
      {
        runValidators: true
      }
    )
    if (!res.nModified || res.nModified < 1) throw new Error('err_no_project')
    return update
  }
}

const CUSTOM_UPDATABLE_PROPERTIES: string[] = Object.keys(UPDATE_CONTROLLERS)

const SIMPLY_UPDATABLE_PROPERTIES: string[] = ['heat_vision', 'tags', 'report_evals']
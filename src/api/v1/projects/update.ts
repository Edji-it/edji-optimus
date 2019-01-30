// library imports
import { Request, Response, NextFunction } from 'express'
import * as mongoose from 'mongoose'
import { pick } from 'underscore'

// project imports
import * as Project from '../../../models/Project'
import * as Comment from '../../../models/Comment'
import { cleanMongoValidationError } from '../../../error-handlers/mongo-validation'

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

    const updateObj = await UPDATE_CONTROLLERS[update_property]({ project_id, user_id: user._id, update })
    return res.status(200).send(updateObj)
  } catch (err) {
    if (err.name === 'ValidationError') {
      let validationErrors = cleanMongoValidationError(err)
      return res.status(406).send({ validationErrors })
    } else if (err.message === 'err_no_project') {
      return res.status(404).send({ error: 'no project found for that id' })
    }
    return next(err)
  }
}

const UPDATE_CONTROLLERS: {
  [key: string]: (props: { project_id: string, user_id: string, update: any }) => Promise<any>
} = {
  comments: async function ({ project_id, user_id, update: commentData }) {
    /**
     * just validate comment to avoid running validators on entire project in findOneAndUpdate
     *  this will throw an error which should be caught by the route's catch
     */
    let project = await Project.findById(project_id)
    if (!project) throw new Error('err_no_project')


    let comment
    if (commentData._id) {
      // this method only works because it's an array of subdocuments in mongoose
      comment = project.comments.id(commentData._id)
    }

    // we still might not find the comment, so we'll create it here if we didn't find it in the project
    if (comment) {
      // make all of the updates
      for (let prop in commentData) {
        comment[prop] = commentData[prop]
      }
    } else {
      comment = new Comment(commentData)
      comment.createdAt = Date.now() // since we're not directly calling save() on the Project, we are manually adding createdAt
      project.comments.push(comment)
    }
    comment.updatedAt = Date.now() // also manually update updatedAt
    await comment.validate() // validate here
    await project.edjiSave({ mongooseOptions: { new: true, runValidators: false } })
    return comment
  }
}

const CUSTOM_UPDATABLE_PROPERTIES: string[] = Object.keys(UPDATE_CONTROLLERS)

const SIMPLY_UPDATABLE_PROPERTIES: string[] = ['heat_vision', 'tags', 'report_evals']
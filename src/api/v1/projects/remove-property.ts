// library imports
import { Request, Response, NextFunction } from 'express'
import * as mongoose from 'mongoose'

// project imports
import * as Project from '../../../models/Project'
import { cleanMongoValidationError } from '../../../error-handlers/mongo-validation'

export async function RemoverojectController(req: Request, res: Response, next: NextFunction) {
  try {
    const { project_id } = req.params
    let user = req.user

    if (!mongoose['validateEdjiId'](project_id)) {
      return res.status(400).send({ error: 'invalid project id passed' })
    }
    
    let project = await Project.deleteOne({ 
      _id: project_id, 
      teacher_id: user._id 
    })

    if (!project) {
      return res.status(404).send({ error: 'no project at that id' })
    }

    return res.status(204).send()
  } catch (err) {
    if (err.name === "ValidationError") {
      let validationErrors = cleanMongoValidationError(err)
      return res.status(406).send({ validationErrors })
    }
    return next(err)
  }
}

export async function RemovePropertyController(req: Request, res: Response, next: NextFunction) {
  try {
    const { project_id, remove_property } = req.params
    const comment_id = req.query.comment_id || req.params.comment_id // need the req.params check here for legacy calls from the projects route
    const reply_ids = req.query.reply_ids

    // consolidate _ids in to one array for removal
    let idArray: string[]
    (idArray = reply_ids ? reply_ids : []).push(comment_id)

    if (!idArray) {
      return res.status(400).send({ error: 'removable properties not found on request' })
    }

    if (!mongoose['validateEdjiId'](project_id)) {
      return res.status(400).send({ error: 'invalid project or property id passed' })
    }

    if (!CUSTOM_REMOVABLE_PROPERTIES.includes(remove_property)) {
      return res.status(400).send({ error: 'requested removal of a property which could not be removed' })
    }

    let removeObj = await REMOVE_CONTROLLERS[remove_property]({ project_id, idArray })

    return res.status(200).send(removeObj)
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

const REMOVE_CONTROLLERS: {
  [key: string]: (props: { project_id: string, idArray: string[] }) => Promise<any>
} = {
  comments: async function ({ project_id, idArray }) {
    const res = await Project.update(
      {
        _id: project_id
      },
      {
        $pull: {
          comments: { 
            _id: {
              $in: idArray
            }
          }
        }
      },
      {
        runValidators: true
      }
    )
    if (!res.nModified || res.nModified < 1) throw new Error('err_no_project')
    return { comments_deleted: idArray }
  },
  answers: async function ({ project_id, idArray }) {
    const res = await Project.update(
      {
        _id: project_id
      },
      {
        $pull: {
          answers: { 
            _id: {
              $in: idArray
            }
          }
        }
      },
      {
        runValidators: true
      }
    )
    if (!res.nModified || res.nModified < 1) throw new Error('err_no_project')
    return { answers_deleted: idArray }
  }
}

const CUSTOM_REMOVABLE_PROPERTIES: string[] = Object.keys(REMOVE_CONTROLLERS)
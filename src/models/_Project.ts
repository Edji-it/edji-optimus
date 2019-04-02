// library imports
import { RequestHandler } from 'express'

// project imports
import * as Project from './Project'

export const deleteOwnerProject = (): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { project_id } = req.params
      const { user } = req

      // delete the reading first - we'll do additional cleanup if this works
      const deleteRes = await Project.deleteOne({ _id: project_id, teacher_id: user._id })
      if (!deleteRes || !deleteRes.n || deleteRes.n < 1) {
        return res.status(404).send() // it would be sweet to figure out how to throw an error here and catch it in some middleware runner...
      }
      res.body.deleted = deleteRes.n
      return next()
    } catch (err) {
      next(err)
    }
  }
}

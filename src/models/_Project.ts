// library imports
import { RequestHandler } from 'express'

// project imports
import Project from './Project'

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
      res.status(204)
      return next()
    } catch (err) {
      next(err)
    }
  }
}

export const createProject = (): RequestHandler => {
  return async (req, res, next) => {
    try {
      const projectData = req.body
      req.context.customCode = projectData.code
      if (!projectData.teacher_id) {
        projectData.teacher_id = req.context.user._id
      }
      const commentsCopy = req.context.commentsCopy
      if (commentsCopy && commentsCopy.length > 0) {
        projectData.comments = commentsCopy
      }
      res.body = await new Project(projectData).edjiSave()
      res.status(201)
      next()
    } catch (err) {
      return next(err)
    }
  }
}

export const getCommentsCopy = (): RequestHandler => {
  return async (req, res, next) => {
    const user = req.context.user
    if (req.query.copy_id) {
      const project = await Project.findById(req.query.copy_id)
      if (project) {
        req.context.commentsCopy = project.comments.filter(comment => user._id.equals(comment.user_id))
      }
    }
    next()
  }
}

// library imports
import { RequestHandler } from 'express'

// Project imports
import Module from './Module'
import Project from './Project'

export const deleteOwnerModule = (): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { module_id } = req.params
      const { user } = req

      const module = await Module.findOne({ _id: module_id, teacher_id: user._id })
      if (!module) {
        return res.status(404).send()
      }

      // Delete all projects associated with the module
      for (let i = 0; i < module.groups.length; i++) {
        for (let y = 0; y < module.groups[i].project_ids.length; y++) {
          const project = await Project.findOne({ _id: module.groups[i].project_ids[y], teacher_id: user._id })
          if (project) {
            await project.delete()
          }
        }
      }

      // Once projects are deleted, delete module
      await module.delete()

      res.status(204)
      return next()
    } catch (err) {
      next(err)
    }
  }
}

export const createModule = (): RequestHandler => {
  return async (req, res, next) => {
    try {
      const moduleData = req.body
      moduleData.teacher_id = req.context.user._id
      res.body = await new Module(moduleData).edjiSave()
      res.status(201)
      next()
    } catch (err) {
      return next(err)
    }
  }
}

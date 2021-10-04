// library imports
import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongodb'
import { pick } from 'underscore'
import Project from '../../../models/Project'
import User from '../../../models/User'
import Pipeline from './_recent-activity'

export async function PostActivityRecapHandler(req: Request, res: Response, next: NextFunction) {
  const { user } = req // this is the user that's logged in, which we'll be merging the oauth account into
  const { subscribe } = req.body
  if (!subscribe) {
    return res.status(400).send({ error: 'subscribe required in body' })
  }

  try {
    user.prefs.activityRecap = subscribe === 'yes'
    await user.edjiSave()
    return res.status(200).send()
  } catch (err) {
    return next(err)
  }
}

export async function GetActivityRecapHandler(req: Request, res: Response, next: NextFunction) {
  const { user } = req // this is the user that's logged in, which we'll be merging the oauth account into
  let { page, limit, project } = req.query

  // If page and limit aren't specified, default them to 1 and 5
  let nPage = page ? Number(page) : 1,
    nLimit = limit ? Number(limit) : 5

  let pipeline: any[] = Pipeline(user._id)
  if (project) {
    pipeline.unshift({
      $match: {
        _id: new ObjectId(project),
      },
    })
  }

  try {
    const projects = await Project.aggregate(pipeline)

    // Go through all comments and add replyTo's
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
      project.comments.forEach(comment => {
        comment.comment_type = comment.reply_to ? 'reply' : 'comment'
        if (comment.reply_to) {
          comment.replyTo = project.comments.find(x => String(x._id) === String(comment.reply_to))
          delete comment.reply_to
        }
      })
      project.comments = project.comments.slice((nPage - 1) * nLimit, nPage * nLimit)
    }

    return res.status(200).send(projects)
  } catch (err) {
    return next(err)
  }
}

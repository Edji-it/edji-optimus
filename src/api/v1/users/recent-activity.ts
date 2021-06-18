// library imports
import { Request, Response, NextFunction } from 'express'
import Project from '../../../models/Project'
import * as helpers from '../projects/_retrieve'

export async function PostActivityRecapHandler(req: Request, res: Response, next: NextFunction) {
  const { user } = req // this is the user that's logged in, which we'll be merging the oauth account into
  const { subscribe } = req.body
  if (!subscribe) {
    return res.status(400).send({ error: 'subscribe required in body' })
  }

  try {
    user.prefs.activityRecap = subscribe === "yes"
    await user.edjiSave()
    return res.status(200).send()
  } catch (err) {
    return next(err)
  }
}

export async function GetActivityRecapHandler(req: Request, res: Response, next: NextFunction) {
  const { user } = req // this is the user that's logged in, which we'll be merging the oauth account into
  
  let pipeline = [{ $match: { teacher_id: user._id} }]
  pipeline = pipeline.concat(helpers.populateProperties(["reading_id"]))

  try{
    const projects = await Project.aggregate(pipeline)

    // Collect recent activity from projects
    let activity: { name: string, _id: string, comments: { author: string, type: string, data: string, date: Date, replyTo?: string }[] }[] = []

    projects.forEach(project => {
      let comments = [] as { author: string, type: string, data: string, date: Date, replyTo?: string }[]

      const coms = project.comments
      coms.forEach((comment) => {
        if(comment.data.length > 0) {
          comments.push({
            author: comment.author,
            type: comment.reply_to ? 'reply' : 'comment',
            data: comment.data,
            date: comment.createdAt,
            replyTo: comment.reply_to ? coms.find(x => String(x._id) === String(comment.reply_to)).author : undefined,
          })
        }
      })

      // Sort comments by date
      comments.sort((a, b) => {
        return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
      })

      if(comments.length > 0) {
        activity.push({
          name: project.reading_id.title,
          _id: project._id,
          comments: comments,
        })
      }
    })

    return res.status(200).send(activity)
  } catch(err) {
    return next(err)
  }
}

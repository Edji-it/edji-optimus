// library imports
import { Request, Response, NextFunction } from 'express'
import { pick } from 'underscore'
import Project from '../../../models/Project'
import User from '../../../models/User'
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
    let activity: { name: string, group: string, _id: string, date: Date, comments: { _id: string, author: any, type: string, data: string, date: Date, replyTo?: { _id: string, name: string } }[] }[] = []

    let cachedUsers = []

    // We must use for loops instead of forEach so we can await
    for(let projectIndex = 0; projectIndex < projects.length; projectIndex++) {
      const project = projects[projectIndex]

      let comments = [] as { _id: string, author: any, type: string, data: string, date: Date, replyTo?: { _id: string, name: string } }[]

      const coms = project.comments
      for(let commentIndex = 0; commentIndex < coms.length; commentIndex++) {
        const comment = coms[commentIndex]
        if(comment.data.length > 0) {

          // These are the properties we need for the activity feed
          const publicProperties = [
            '_id',
            'fullname',
            'firstname',
            'lastname',
            'initials',
            'hero_status',
            'avatar',
            'createdAt',
            'updatedAt',
          ]

          let author = cachedUsers.find(x => String(x._id) === String(comment.user_id))
          if(!author) {
            author = await User.findById(comment.user_id)
            cachedUsers.push(author)
          }

          let publicAuthor = pick(author, (value, key, object) => {
            return publicProperties.indexOf(key) > -1
          })

          comments.push({
            author: publicAuthor,
            type: comment.reply_to ? 'reply' : 'comment',
            data: comment.data,
            date: comment.createdAt,
            replyTo: comment.reply_to ? coms.find(x => String(x._id) === String(comment.reply_to)) : undefined,
            _id: comment._id,
          })
        }
      }

      // Sort comments by date
      comments.sort((a, b) => {
        return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
      })

      if(comments.length > 0) {
        activity.push({
          name: project.reading_id.title,
          _id: project._id,
          comments: comments,
          date: project.createdAt,
          group: project.label
        })
      }
    }

    // Sort projects by date
    activity.sort((a, b) => {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    });

    return res.status(200).send(activity)
  } catch(err) {
    return next(err)
  }
}

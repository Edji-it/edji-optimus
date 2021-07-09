import { pick } from 'underscore'

import { EmailService } from "../services/email"
import User, { UserDocument } from "../models/User"
import Project from "../models/Project"
import transform from '../utils/edji-date'
import * as helpers from '../api/v1/projects/_retrieve'

export const EmailHandler = async function() {
  const users: UserDocument[] = await User.find({
    'prefs.activityRecap': true,
  }).exec()

  const baseUrl = `${process.env.EDJI_STAGE === 'local' ? 'http' : 'https'}:${process.env.CLIENT_URL}`
  
  let cachedUsers = []

  users.forEach(async user => {

    let pipeline = [{ $match: { teacher_id: user._id} }]
    pipeline = pipeline.concat(helpers.populateProperties(["reading_id"]))
  
    const projects = await Project.aggregate(pipeline)

    // Collect recent activity from projects
    let activity: { name: string, group: string, _id: string, date: Date, comments: { _id: string, author: any, type: string, text: string, data: string, date: Date, dateString: string, replyTo?: any }[] }[] = []
    let totalComments = 0

    // We must use for loops instead of forEach so we can await
    for(let projectIndex = 0; projectIndex < projects.length; projectIndex++) {
      const project = projects[projectIndex]

      let comments = [] as { _id: string, author: any, type: string, text: string, data: string, date: Date, dateString: string, replyTo?: any }[]

      const coms = project.comments
      for(let commentIndex = 0; commentIndex < coms.length; commentIndex++) {
        const comment = coms[commentIndex]
        if(comment.data.length > 0) {

          // Since the emails don't contain a user-avatar, we'll just snag the full name.
          const publicProperties = [
            'fullname',
          ]

          let author = cachedUsers.find(x => String(x._id) === String(comment.user_id))
          if(!author) {
            author = pick(await User.findById(comment.user_id), (value, key, object) => {
              return publicProperties.indexOf(key) > -1
            })
            cachedUsers.push(author)
          }

          totalComments++
          comments.push({
            author: author,
            type: comment.reply_to ? 'reply' : 'comment',
            data: comment.data,
            date: comment.createdAt,
            dateString: transform(comment.createdAt),
            replyTo: comment.reply_to ? coms.find(x => String(x._id) === String(comment.reply_to)) : undefined,
            _id: comment._id,
            text: comment.text,
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
          group: project.label,
        })
      }
    }

    // Sort projects by date
    activity.sort((a, b) => {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    });

    if(activity.length > 0) {
      EmailService.sendEmail({
        email_template: "recent-activity",
        name: user.fullname,
        subject: "Your recent activity is ready!",
        email: user.email,
        from: "Edji <support@edji.it>",
        vars_object: { projects: activity, totalComments, baseUrl } as any,
      })
    }
  })
}
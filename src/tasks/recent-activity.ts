import { EmailService } from "../services/email"
import User, { UserDocument } from "../models/User"
import Project from "../models/Project"
import * as helpers from '../api/v1/projects/_retrieve'

export const EmailHandler = async function() {
  console.log("pre-send")

  const users: UserDocument[] = await User.find({
    'prefs.activityRecap': true,
    'email': 'bnylund19@gmail.com', // Remove this line when we're done with this ticket
  }).exec()

  console.log("Sending email to " + users.length + " users")
  
  users.forEach(async user => {

    let pipeline = [{ $match: { teacher_id: user._id} }]
    pipeline = pipeline.concat(helpers.populateProperties(["reading_id"]))
  
    const projects = await Project.aggregate(pipeline)

    // Collect recent activity from projects
    let activity: { _id: string, name: string, date: Date, comments: { _id: string, author: string, type: string, data: string, date: Date, replyTo?: { _id: string, name: string } }[] }[] = []

    projects.forEach(project => {
      let comments = [] as { _id: string, author: string, type: string, data: string, date: Date, replyTo?: { _id: string, name: string } }[]

      const coms = project.comments
      coms.forEach((comment) => {
        if(comment.data.length > 0 && Math.abs(Date.now() - new Date(comment.createdAt).getTime()) /* ms */ /1000 /* s */ /60 /* m */ /60 /* h */ <= 24) {
          comments.push({
            author: comment.author,
            type: comment.reply_to ? 'reply' : 'comment',
            data: comment.data,
            date: comment.createdAt,
            replyTo: comment.reply_to ? {
              name: coms.find(x => String(x._id) === String(comment.reply_to)).author,
              _id: comment.reply_to,
            } : undefined,
            _id: comment._id,
          })
        }
      })

      // Sort comments by date
      comments.sort((a, b) => {
        return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
      })

      if(comments.length > 0) {
        activity.push({
          _id: project._id,
          name: project.reading_id.title,
          comments: comments,
          date: project.createdAt,
        })
      }
    })

    // Sort projects by date
    activity.sort((a, b) => {
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    });

    if(activity.length > 0) {
      EmailService.sendEmail({
        email_template: "recent-activity",
        name: user.fullname,
        subject: "Recent Reading Activity",
        email: user.email,
        from: "Edji <support@edji.it>",
        vars_object: { recent_activity: activity } as any,
      })
    }
  })
  console.log("Done!")
}
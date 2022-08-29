// project imports
import Project from '../../../models/Project'
import { deleteFromS3 } from './_update'

export async function removeCommentFromArray({ project_id, user, comment_id, idArray }, commentType: string) {
  const project = await Project.findOne({ _id: project_id }).select({
    [commentType]: 1,
    teacher_id: 1,
    co_owner_ids: 1,
    user_id: 1,
  })
  const comment = project[commentType].find(c => c.equals(comment_id))
  if (
    project.teacher_id.equals(user._id) || // teachers can delete comments
    project.co_owner_ids.find(id => id.equals(user._id)) || // coteachers can delete comments
    comment.user_id.equals(user._id) // users can delete their own comments
  ) {
    // the user can delete the comment and its replies
    project[commentType] = project[commentType].filter(c => {
      return !c._id.equals(comment_id) && !(c.reply_to && c.reply_to.equals(comment_id))
    })
    await project.edjiSave()
  } else {
    // return the 403
    throw new Error('err_not_authorized')
  }

  if (comment && comment.url) {
    deleteFromS3(comment.url)
  }
}

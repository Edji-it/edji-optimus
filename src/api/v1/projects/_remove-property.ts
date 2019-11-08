// project imports
import * as Project from '../../../models/Project'
import { deleteFromS3 } from './_update'

export async function removeCommentFromArray({ project_id, user, comment_id, idArray }, commentType: string) {
  const res = await Project.findOneAndUpdate(
    {
      _id: project_id,
      $or: [
        {
          teacher_id: user._id, // this lets teachers delete a student's comment
        },
        {
          co_owner_ids: user._id,
        },
        {
          [commentType]: {
            $elemMatch: {
              _id: comment_id,
              user_id: user._id, // this is likely a student deleting their own comment
            },
          },
        },
      ],
    },
    {
      $pull: {
        [commentType]: {
          _id: {
            $in: idArray,
          },
        },
      },
    },
  ).select({ [commentType]: 1 })

  if (!res) throw new Error('err_not_authorized')

  // if we have an asset from the S3 bucket on the comment or answer we just deleted, we need to remove it from S3
  const comment = res && res[commentType] && res[commentType].id(comment_id)
  if (comment.url) {
    deleteFromS3(comment.url)
  }
}

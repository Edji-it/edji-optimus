// project imports
import * as Project from '../../../models/Project'
import { deleteFromS3 } from './_update'

export async function removeCommentFromArray({ project_id, user, comment_id, idArray }, commentType: string) {
  const res = await Project.findOneAndUpdate(
    {
      _id: project_id,
      $or: [
        { 
          teacher_id: user._id // this lets teachers delete a student's comment
        }, 
        {
          comments: {
            $elemMatch: { 
              _id: comment_id,
              user_id: user._id // this is likely a student deleting their own comment
            }
          }
        }
      ]
    },
    {
      $pull: {
        [commentType]: {
          _id: {
            $in: idArray
          }
        }
      }
    }
  )

  // if we have an asset from the S3 bucket on the comment or answer we just deleted, we need to remove it from S3
  let comments = res[commentType]
  const len = comments.length
  for (let i=0; i<len; i++) {
    if (comments[i]._id.equals(comment_id)) {
      let comment = comments[i]
      if (comment.url) {
        deleteFromS3(comment.url)
      }
    }
  }
  
  return
}
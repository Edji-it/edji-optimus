// project imports
import * as Project from '../../../models/Project'

export async function removeCommentFromArray({ project_id, idArray }, commentType: string) {
  const res = await Project.update(
    {
      _id: project_id
    },
    {
      $pull: {
        [commentType]: { 
          _id: {
            $in: idArray
          }
        }
      }
    },
    {
      runValidators: true
    }
  )
  if (!res.nModified || res.nModified < 1) throw new Error('err_no_project')
  return {
    type: commentType, 
    removed: idArray 
  }
}
import { del } from 'request-promise-native'
import { captureException } from '@sentry/node'

import * as Project from '../../../models/Project'
import * as Comment from '../../../models/Comment'

/**
 * Sets up the options and returns a promise which will call grapple's route to delete an asset from s3
 * @param url The url of the asset to delete (typically looks like //images.edji.it/something)
 * @returns Promise resolved with a response body from Grapple
 */
export async function deleteFromS3(url: string): Promise<void> {
  try {
    const options = {
      uri: [process.env.EDJI_GRAPPLE_DOMAIN, "v1", "s3", encodeURIComponent(url)].join("/"),
      headers: { Authorization: process.env.EDJI_GRAPPLE_TOKEN },
      json: true
    }
    const res = await del(options)
  } catch (err) {
    captureException(err)
  }
}

export async function updateCommentArray({ project_id, user, update: commentData }, commentArrayName) {
  /**
   * just validate comment to avoid running validators on entire project in findOneAndUpdate
   *  this will throw an error which should be caught by the route's catch
   */
  let project = await Project.findById(project_id)
  if (!project) throw new Error('err_no_project')

  let comment
  if (commentData._id) {
    // this method only works because it's an array of subdocuments in mongoose
    comment = project[commentArrayName].id(commentData._id)
  }

  // we still might not find the comment, so we'll create it here if we didn't find it in the project
  if (comment) {
    if (!user._id.equals(comment.user_id)) throw new Error('err_not_authorized')
    // this is a cleaning function mostly used for cleaning audio data stashed in s3
    if (commentData.url && commentData.url !== comment.url) {
      deleteFromS3(comment.url)
    }
    // make all of the updates
    for (let prop in commentData) {
      comment[prop] = commentData[prop]
    }
  } else {
    comment = new Comment(commentData)
    comment.author = user.fullname
    comment.createdAt = Date.now() // since we're not directly calling save() on the Project, we are manually adding createdAt
    project[commentArrayName].push(comment)
  }
  comment.updatedAt = Date.now() // also manually update updatedAt
  // await comment.validate() // validate here
  await project.edjiSave({ mongooseOptions: { new: true, runValidators: false } })
  return comment
}
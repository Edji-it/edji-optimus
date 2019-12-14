// library imports
import { del } from 'request-promise-native'
import { captureException } from '@sentry/node'

// project imports
import Project from '../../../models/Project'
import Comment from '../../../models/Comment'
import Feedback from '../../../models/Feedback'

/**
 * Sets up the options and returns a promise which will call grapple's route to delete an asset from s3
 * @param url The url of the asset to delete (typically looks like //images.edji.it/something)
 * @returns Promise resolved with a response body from Grapple
 */
export async function deleteFromS3(url: string): Promise<void> {
  try {
    const options = {
      uri: [process.env.EDJI_GRAPPLE_DOMAIN, 'v1', 's3', encodeURIComponent(url)].join('/'),
      headers: { Authorization: process.env.EDJI_GRAPPLE_TOKEN },
      json: true,
    }
    const res = await del(options)
  } catch (err) {
    captureException(err)
  }
}

export async function updatePropertyArray({ project_id, user, update: propData }, propArrayName: string) {
  /**
   * just validate comment/answer to avoid running validators on entire project in findOneAndUpdate
   *  this will throw an error which should be caught by the route's catch
   */
  const project = await Project.findById(project_id).select({ co_owner_ids: 1, teacher_id: 1, [propArrayName]: 1 })
  if (!project) throw new Error('err_no_project')

  const updateArray = project[propArrayName]

  let propObj
  if (propData._id) {
    // this method only works because it's an array of subdocuments in mongoose
    propObj = updateArray.id(propData._id)
  }

  if (propArrayName === 'feedback') {
    // check if user owns project or is a co_owner
    if (
      !user._id.equals(project.teacher_id) &&
      !(project.co_owner_ids && project.co_owner_ids.some(id => user._id.equals(id)))
    )
      throw new Error('err_not_authorized')
  }

  // we still might not find the property in its array on the project, so we'll create it here if not found
  if (propObj) {
    if (propObj.user_id && !user._id.equals(propObj.user_id)) throw new Error('err_not_authorized')
    // this is a cleaning function mostly used for cleaning audio data stashed in s3
    if (propData.url && propData.url !== propObj.url) {
      deleteFromS3(propObj.url)
    }
    // make all of the updates
    for (let prop in propData) {
      propObj[prop] = propData[prop]
    }
  } else {
    const model = propArrayName === 'feedback' ? Feedback : Comment
    // if a comment or an answer, we need to build a new Comment from the schema
    propObj = new model(propData)
    propObj.author = user.fullname
    propObj.user_id = user._id
    propObj.createdAt = Date.now()
    updateArray.push(propObj)
  }
  propObj.updatedAt = Date.now() // also manually update updatedAt
  const error = propObj.validateSync() // manually validate here, don't validate project so that if anything goes wrong on project we can still save comments
  if (error) throw error
  await Project.updateOne({ _id: project._id }, { $set: { [propArrayName]: updateArray } }, { runValidators: false })
  return propObj
}

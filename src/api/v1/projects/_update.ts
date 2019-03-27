// library imports
import { del } from 'request-promise-native'
import { captureException } from '@sentry/node'
import { ObjectId } from 'mongodb'

// project imports
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

export async function updatePropertyArray({ project_id, user, update: propData }, propArrayName) {
  /**
   * just validate comment/answer to avoid running validators on entire project in findOneAndUpdate
   *  this will throw an error which should be caught by the route's catch
   */
  let project = await Project.findById(project_id)
  if (!project) throw new Error('err_no_project')

  let propObj
  if (propData._id) {
    // this method only works because it's an array of subdocuments in mongoose
    propObj = project[propArrayName].id(propData._id)
  }

  // we still might not find the property in its array on the project, so we'll create it here if not found
  if (propObj) {
    if (propArrayName!=='feedback' && !user._id.equals(propObj.user_id)) throw new Error('err_not_authorized')
    // this is a cleaning function mostly used for cleaning audio data stashed in s3
    if (propData.url && propData.url !== propObj.url) {
      deleteFromS3(propObj.url)
    }
    // make all of the updates
    for (let prop in propData) {
      propObj[prop] = propData[prop]
    }
  } else {
    if (propArrayName!=='feedback') {
      // if a comment or an answer, we need to build a new Comment from the schema
      propObj = new Comment(propData)
      propObj.author = user.fullname
      propObj.createdAt = Date.now() // since we're not directly calling save() on the Project, we are manually adding createdAt
    } else {
      propObj = propData
    }
    project[propArrayName].push(propObj)
  }
  propObj.updatedAt = Date.now() // also manually update updatedAt
  // await comment.validate() // validate here
  await project.edjiSave({ mongooseOptions: { new: true, runValidators: false } })
  return propObj
}
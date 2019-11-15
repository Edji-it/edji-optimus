// library imports
import { RequestHandler } from 'express'
import { pick } from 'underscore'

// project imports
import Reading from './Reading'
import Project from './Project'
import * as ReadingVersion from './ReadingVersion'
import { deleteOne } from './../services/elasticsearch'

export const deleteOwnerReading = (): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { reading_id } = req.params
      const { user } = req

      // delete the reading first - we'll do additional cleanup if this works
      const readingRes = await Reading.deleteOne({ _id: reading_id, owner_id: user._id })
      if (!readingRes || !readingRes.n || readingRes.n < 1) {
        return res.status(404).send() // it would be sweet to figure out how to throw an error here and catch it in some middleware runner...
      }
      Object.assign(res.body, { readings_deleted: readingRes.n })
      return next()
    } catch (err) {
      next(err)
    }
  }
}

export const deleteReadingRelatedContent = (): RequestHandler => {
  return async (req, res, next) => {
    try {
      const { reading_id } = req.params
      let promises = []
      // delete all projects associated with the reading
      promises.push(Project.deleteMany({ reading_id }))
      // pull that reading from the list of readings for a single version
      promises.push(ReadingVersion.updateOne({ readings: reading_id }, { $pull: { readings: reading_id } }))
      // remove from elasticsearch
      promises.push(
        deleteOne({
          index: 'readings',
          id: reading_id,
        }),
      )
      const [projectRes, versionRes, elasticRes] = await Promise.all(promises)
      Object.assign(res.body, {
        projects_deleted: projectRes.n,
        versions_updated: versionRes.n,
        search_deleted: elasticRes && elasticRes.result === 'deleted',
      })
      return next()
    } catch (err) {
      next(err)
    }
  }
}

export const READING_CAN_UPDATE = [
  'html',
  'words',
  'title',
  'public',
  'source',
  'cover_img',
  'tags',
  'draft',
  'questions',
  'subjects',
  'grade_levels',
  'owner_bookmarked',
  'default_instructions',
  'createdAt',
]

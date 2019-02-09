// library import
import * as joi from 'joi'
import { ValidationResult } from 'joi'
import { ObjectId } from 'mongodb'
import elastic from '../../../elasticsearch'

// project imports
import * as Reading from './../../../models/Reading'

export interface ReadingQuery {
  ids?: string[]
  html?: string
  title?: string
  parent_id?: string
  owner_id?: string
  // public?: boolean
  source?: string
  grade_levels_lte?: number
  grade_levels_gte?: number
  subjects?: string[]
  version_id?: string
  owner_bookmarked?: boolean
  start?: number
  size?: number
}

const querySchema = joi.object().keys({
  _ids: joi.array().items(joi.string()),
  html: joi.string(),
  title: joi.string(),
  parent_id: joi.string(),
  owner_id: joi.string(),
  // public: joi.boolean(),
  source: joi.string(),
  grade_levels_lte: joi.number(),
  grade_levels_gte: joi.number(),
  subjects: joi.array().items(joi.string()),
  version_id: joi.string(),
  owner_bookmarked: joi.boolean(),
  start: joi.number().min(0).max(1000).default(0),
  size: joi.number().min(0).max(50).default(15)
})

const queriableFields = [
  'html',
  'title',
  'parent_id',
  'owner_id',
  // 'public',
  'source',
  'subjects',
  'version_id',
  'owner_bookmarked'
]

/**
 * ensures that the search endpoint can handle any parameters it is passed
 * @param query query object expected to match the search endpoint's interface
 */
export function validateSearchQuery(query: ReadingQuery): ValidationResult<ReadingQuery> {
  if (query.subjects && !(query.subjects instanceof Array)) {
    query.subjects = [query.subjects]
  }
  return joi.validate(query, querySchema)
}

/**
 * supports the interface for querying multiple ids
 * @param ids list of ids that you want returned from the database
 */
export function searchByIds(ids: string[]): Promise<any> {
  return Reading.find({
    _id: {
      $in: ids.map(id => new ObjectId(id)) // make array of string objectids into objectids
    }
  })
}

export function constructSearch(query: ReadingQuery): Promise<any> {
  let must: any[] = []

  // add conditions for all fields where we can directly set the value
  for (let field of queriableFields) {
    if (query.hasOwnProperty(field)) {
      let val = query[field]
      if (val instanceof Array) {
        must.push({
          match: {
            [field]: val.join(' ')
          }
        })
      } else {
        must.push({
          match: {
            [field]: val
          }
        })
      }
    }
  }

  // handle pulling apart grade_levels here so that the search query url matches the front end
  if (query.grade_levels_lte || query.grade_levels_gte) {
    const { grade_levels_lte: lte, grade_levels_gte: gte } = query
    let grade_levels: { lte?: number, gte?: number } = {}
    lte && (grade_levels.lte = lte)
    gte && (grade_levels.gte = gte)

    must.push({
      range: { grade_levels }
    })
  }

  // for now, only allow public readings to be searched
  must.push({
    match: {
      public: true
    }
  })

  return elastic.search({
    index: 'readings',
    type: 'default',
    body: {
      query: {
        bool: {
          must
        }
      },
      size: query.size
    }
  })
}
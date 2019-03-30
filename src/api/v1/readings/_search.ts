// library import
import * as joi from 'joi'
import { ValidationResult } from 'joi'
import { ObjectId } from 'mongodb'
import elastic from '../../../elasticsearch'

// project imports
import * as Reading from './../../../models/Reading'

export interface ReadingQuery {
  ids?: string[]
  q?: string
  html?: string
  title?: string
  parent_id?: string
  owner_id?: string
  // public?: boolean
  source?: string
  grade_levels_lte?: number
  grade_levels_gte?: number
  subjects?: string
  version_id?: string
  owner_bookmarked?: boolean
  from?: number
  size?: number
}

const querySchema = joi.object().keys({
  _ids: joi.array().items(joi.string()),
  html: joi.string(),
  title: joi.string(),
  /**
   * the "q" parameter is handled specially, and will be added to the "should" clause for both title and html
   * this means that the text searched in "q" could be either in "title" or "html"
   */
  q: joi.string(),
  parent_id: joi.string(),
  owner_id: joi.string(),
  // public: joi.boolean(),
  source: joi.string(),
  grade_levels_lte: joi.number(),
  grade_levels_gte: joi.number(),
  subjects: joi.string(),
  version_id: joi.string(),
  owner_bookmarked: joi.boolean(),
  from: joi.number().min(0).max(1000).default(0),
  size: joi.number().min(0).max(50).default(15)
})

const queriableStringFields = [
  'html',
  'title',
  'parent_id',
  'owner_id',
  'source',
  'subjects',
  'version_id'
]

const queriableBooleanFields = [
  // 'public',
  'owner_bookmarked'
]

const arrayFieldsToConverToStrings = [
  'owner_id',
  'subjects'
]

/**
 * ensures that the search endpoint can handle any parameters it is passed
 * @param query query object expected to match the search endpoint's interface
 */
export function validateSearchQuery(query: ReadingQuery): ValidationResult<ReadingQuery> {
  arrayFieldsToConverToStrings.forEach((field) => {
    if (query[field] && query[field] instanceof Array) {
      query[field] = query[field].join(' ')
    }
  })
  return joi.validate(query, querySchema)
}

/**
 * supports the interface for querying multiple ids
 * @param ids list of ids that you want returned from the database (MUST be in the order you want them returned)
 */
export async function searchByIds(ids: string[]): Promise<{ _id: ObjectId, [key: string]: any }[]> {
  let results: { _id: ObjectId, [key: string]: any }[] = await Reading.aggregate([
    {
      $match: {
        _id: {
          $in: ids.map(id => new ObjectId(id)) // make array of string objectids into objectids
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner_id',
        foreignField: '_id',
        as: 'owner'
      }
    },
    { $unwind: '$owner' }, // owner comes back as an array, but there will only ever be one
    {
      $project: {
        'title': true,
        'owner_id': true,
        'public': true,
        'owner._id': true,
        'owner.fullname': true,
        'owner.username': true,
        'owner.avatar': true,
        'owner.identities': true,
        'promoter_ids': true,
        'source': true,
        'subjects': true,
        'grade_levels': true,
        'cover_img': true,
        'tags': true,
        'draft': true,
        'version_id': true,
        'createdAt': true,
        'updatedAt': true,
        'words_preview': { $slice: ['$words', 200] }
      }
    }
  ])
  results.sort((a, b) => {
    return ids.indexOf(a._id.toHexString()) > ids.indexOf(b._id.toHexString()) ? 1 : -1
  })
  return results
}

export function constructSearch(query: ReadingQuery): Promise<any> {
  // fieldQuery will be added to based on query properties
  let fieldQuery = {
    bool: {
      must: [],
      should: []
    }
  }
  let body: any = {
    query: {
      bool: {
        must: [
          fieldQuery
        ],
        must_not: [
          {
            match: {
              draft: true
            }
          }
        ],
        filter: [
          {
            match: {
              public: true
            }
          }
        ]
      }
    }
  }

  if (query.hasOwnProperty('q')) {
    fieldQuery.bool.should.push(
      {
        match: {
          html: query.q
        }
      },
      {
        match: {
          title: query.q
        }
      }
    )
  }

  // add conditions for all fields where we can directly set the value
  for (let field of queriableStringFields) {
    if (query.hasOwnProperty(field)) {
      let val = query[field]
      // if (val instanceof Array) {
      //   must.push({
      //     match: {
      //       [field]: val.join(' ')
      //     }
      //   })
      // } else {
      body.query.bool.must.push({
        match: {
          [field]: val
        }
      })
      // }
    }
  }
  
  for (let field of queriableBooleanFields) {
    if(query.hasOwnProperty(field)) {
      let val = query[field]
      body.query.bool.filter.push({
        match: {
          [field]: val
        }
      })
    }
  }

  // handle pulling apart grade_levels here so that the search query url matches the front end
  if (query.grade_levels_lte || query.grade_levels_gte) {
    const { grade_levels_lte: lte, grade_levels_gte: gte } = query
    let grade_levels: { lte?: number, gte?: number } = {}
    lte && (grade_levels.lte = lte)
    gte && (grade_levels.gte = gte)

    body.query.bool.filter.push({
      range: { grade_levels }
    })
  }

  return elastic.search({
    index: 'readings',
    type: 'default',
    _source: false,
    body,
    from: query.from,
    size: query.size
  })
}
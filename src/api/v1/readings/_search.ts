// library import
import * as joi from 'joi'
import { ValidationResult } from 'joi'
import { ObjectId } from 'mongodb'
import { search } from '../../../services/elasticsearch'

// project imports
import * as Reading from './../../../models/Reading'

export interface ReadingQuery {
  ids?: string[]
  q?: string
  html?: string
  title?: string
  parent_id?: string
  owner_id?: string
  scope?: ScopeEnum
  source?: string
  grade_levels_lte?: number
  grade_levels_gte?: number
  subjects?: string
  version_id?: string
  owner_bookmarked?: boolean
  from?: number
  size?: number
  sort?: string // the field to sort on
  sort_order?: string // asc or desc - the order to sort by
  pop?: PopulationsEnum[]
  buckets?: string[]
  bucket_max?: number
  body?: boolean // debugging tool to return the query body
}

enum ScopeEnum {
  PUBLIC = 'public',
  OWNER = 'owner',
}
const scopeValues = [ScopeEnum.PUBLIC, ScopeEnum.OWNER]
enum PopulationsEnum {
  PROJECTS = 'projects',
}
const ownerPopulations = [PopulationsEnum.PROJECTS]

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
  scope: joi.string().allow(scopeValues),
  source: joi.string(),
  grade_levels_lte: joi.number(),
  grade_levels_gte: joi.number(),
  subjects: joi.string(),
  version_id: joi.string(),
  owner_bookmarked: joi.boolean(),
  from: joi
    .number()
    .min(0)
    .max(1000)
    .default(0),
  size: joi
    .number()
    .min(0)
    .max(50)
    .default(15),
  sort: joi.string(),
  sort_order: joi.string().valid(['asc', 'desc']),
  pop: joi.alternatives().when('scope', { is: 'owner', then: joi.string().allow(ownerPopulations) }),
  buckets: joi
    .array()
    .items(joi.string())
    .single(),
  bucket_max: joi
    .number()
    .min(0)
    .max(30)
    .default(20),
  body: joi.boolean(),
})

const queriableStringFields = ['html', 'title', 'parent_id', 'owner_id', 'source', 'subjects', 'version_id']

const queriableBooleanFields = ['owner_bookmarked']

const arrayFieldsToConverToStrings = ['owner_id', 'subjects']

/**
 * ensures that the search endpoint can handle any parameters it is passed
 * @param query query object expected to match the search endpoint's interface
 */
export function validateSearchQuery(query: ReadingQuery): ValidationResult<ReadingQuery> {
  arrayFieldsToConverToStrings.forEach(field => {
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
export async function searchByIds(
  ids: string[],
  populations: PopulationsEnum[] = [],
): Promise<{ _id: ObjectId; [key: string]: any }[]> {
  let pipeline: any[] = [
    {
      $match: {
        _id: {
          $in: ids.map(id => new ObjectId(id)), // make array of string objectids into objectids
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner_id',
        foreignField: '_id',
        as: 'owner',
      },
    },
    {
      $unwind: {
        path: '$owner',
        preserveNullAndEmptyArrays: true, // this makes sure that if we don't get an owner, it still preserves the reading
      },
    }, // owner comes back as an array, but there will only ever be one
  ]
  if (populations.includes(PopulationsEnum.PROJECTS)) {
    pipeline.push(
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'reading_id',
          as: 'projects',
        },
      },
      {
        $addFields: {
          projects: {
            $map: {
              input: '$projects',
              in: {
                _id: '$$this._id',
                reading_id: '$$this.reading_id',
                teacher_id: '$$this.teacher_id',
                label: '$$this.label',
                code: '$$this.code',
                types: '$$this.types',
                createdAt: '$$this.createdAt',
                updatedAt: '$$this.updatedAt',
                comment_count: {
                  $size: '$$this.comments',
                },
                student_count: {
                  $sum: [{ $size: '$$this.students_ids' }, { $size: '$$this.temp_ids' }],
                },
              },
            },
          },
        },
      },
    )
  }
  pipeline.push({
    $project: {
      title: true,
      owner_id: true,
      public: true,
      'owner._id': true,
      'owner.fullname': true,
      'owner.username': true,
      'owner.avatar': true,
      'owner.identities': true,
      promoter_ids: true,
      source: true,
      parent_id: true,
      owner_bookmarked: true,
      subjects: true,
      grade_levels: true,
      cover_img: true,
      tags: true,
      draft: true,
      version_id: true,
      default_instructions: true,
      createdAt: true,
      updatedAt: true,
      words_preview: { $slice: ['$words', 200] },
      projects: true,
    },
  })
  let results: { _id: ObjectId; [key: string]: any }[] = await Reading.aggregate(pipeline)
  results.sort((a, b) => {
    return ids.indexOf(a._id.toHexString()) > ids.indexOf(b._id.toHexString()) ? 1 : -1
  })
  return results
}

export function constructSearch(query: ReadingQuery, userId?: string) {
  // fieldQuery will be added to based on query properties
  let fieldQuery = {
    bool: {
      must: [],
      should: [],
    },
  }
  let body: any = {
    query: {
      bool: {
        must: [fieldQuery],
        must_not: [
          {
            match: {
              draft: true,
            },
          },
        ],
        filter: [],
      },
    },
  }

  switch (query.scope) {
    case undefined:
    case ScopeEnum.PUBLIC:
      body.query.bool.filter.push({
        match: {
          public: true,
        },
      })
      body.query.bool.must_not.push({
        exists: {
          field: 'parent_id',
        },
      })
      break
    case ScopeEnum.OWNER:
      if (userId) {
        body.query.bool.filter.push({
          match: {
            owner_id: userId,
          },
        })
      }
      break
  }

  if (query.hasOwnProperty('buckets')) {
    body.aggs = {}
    for (let bucket of query.buckets) {
      body.aggs[bucket] = {
        terms: {
          field: `${bucket}.keyword`,
          size: query.bucket_max,
        },
      }
    }
  }

  if (query.hasOwnProperty('q')) {
    fieldQuery.bool.should.push(
      {
        match: {
          html: query.q,
        },
      },
      {
        match: {
          title: query.q,
        },
      },
    )
  }

  // add conditions for all fields where we can directly set the value
  for (let field of queriableStringFields) {
    if (query.hasOwnProperty(field)) {
      let val = query[field]
      body.query.bool.must.push({
        match: {
          [field]: val,
        },
      })
    }
  }

  for (let field of queriableBooleanFields) {
    if (query.hasOwnProperty(field)) {
      let val = query[field]
      body.query.bool.filter.push({
        match: {
          [field]: val,
        },
      })
    }
  }

  // handle pulling apart grade_levels here so that the search query url matches the front end
  if (query.hasOwnProperty('grade_levels_lte') || query.hasOwnProperty('grade_levels_gte')) {
    const { grade_levels_lte: lte, grade_levels_gte: gte } = query

    if (lte === gte) {
      body.query.bool.filter.push({
        match: { grade_levels: lte },
      })
    } else {
      let grade_levels: { lte?: number; gte?: number } = {}
      !isNaN(lte) && (grade_levels.lte = lte)
      !isNaN(gte) && (grade_levels.gte = gte)

      body.query.bool.filter.push({
        range: { grade_levels },
      })
    }
  }

  if (query.sort) {
    body.sort = [
      {
        [query.sort]: query.sort_order ? query.sort_order : 'asc',
      },
    ]
  }

  return search({
    index: 'readings',
    type: 'default',
    _source: false,
    body,
    from: query.from,
    size: query.size,
  })
}

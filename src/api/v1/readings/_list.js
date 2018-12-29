// library imports
const joi = require('joi')

/**
 * Validates query parameters against a query and returns with an object that either does or does not have an `error` property
 * @param {any} requestQuery The req.query passed to the route handler by express
 */
const validateQuery = function (requestQuery) {
  // the values allowable in the query string
  const popValues = joi.string().valid([
    'projects'
  ])

  // define the query schema with joi
  const querySchema = joi.object({
    pop: joi.alternatives().try(
      joi.array().items(popValues),
      popValues
    )
      .default([]),
    start: joi.number().min(0).max(1000).default(0),
    size: joi.number().min(0).max(50).default(15)
  })

  // run validation with joi
  return joi.validate(requestQuery, querySchema)
}

const responseShape = {
  "projects": {
    "$map": {
      "input": "$projects",
      "in": {
        "_id": "$$this._id",
        "reading_id": "$$this.reading_id",
        "teacher_id": "$$this.teacher_id",
        "label": "$$this.label",
        "code": "$$this.code",
        "types": "$$this.types",
        "createdAt": "$$this.createdAt",
        "updatedAt": "$$this.updatedAt",
        "students_ids": "$$this.students_ids",
        "comment_count": {
          "$size": "$$this.comments"
        },
        "student_count": {
          "$sum": [
            { "$size": "$$this.students_ids" },
            { "$size": "$$this.temp_ids" }
          ]
        }
      }
    }
  }
}

/**
 * Gets all of the most recent version of a user's readings and is meant to be expandable by other aggregation pipelines
 * @param {string} userId The user id for which you are searching for readings
 */
const baseAggregation = function (userId) {
  return [
    {
      $match: {
        owner_id: userId
      }
    },
    {
      $project: {
        version_count: { $size: "$readings" },
        readings: 1,
        updatedAt: 1
      }
    },
    { $unwind: "$readings" },
    {
      $group: {
        _id: "$_id",
        reading: { $last: "$readings" },
        version_count: { $last: "$version_count" },
        updatedAt: { $last: "$updatedAt" },
        promoter_count: { $last: "$promoter_count" }
      }
    },
    { $sort: { "updatedAt": -1 } },
    {
      $lookup: {
        from: "readings",
        localField: "reading",
        foreignField: "_id",
        as: "reading"
      }
    },
    { $unwind: "$reading" },
    {
      $project: {
        _id: "$reading._id",
        title: "$reading.title",
        owner_id: "$reading.owner_id",
        teacher_ids: "$reading.teacher_ids",
        "public": "$reading.public",
        source: "$reading.source",
        subjects: "$reading.subjects",
        grade_levels: "$reading.grade_levels",
        cover_img: "$reading.cover_img",
        draft: "$reading.draft",
        version_id: "$reading.version_id",
        createdAt: "$reading.createdAt",
        updatedAt: "$reading.updatedAt",
        version_count: 1,
        owner_bookmarked: "$reading.owner_bookmarked"
      }
    },
    {
      $match: {
        draft: { $ne: true }
      }
    }
  ]
}

/**
 * Adds a lookup for readings to the base aggregation
 * @param {string} userId The user's id
 */
const populateProjectAggregation = function (userId) {
  let aggregation = baseAggregation(userId)
  aggregation.push({
    $lookup: {
      from: 'projects',
      localField: '_id',
      foreignField: 'reading_id',
      as: 'projects'
    }
  }, {
      $addFields: responseShape
    })
  return aggregation
}

/**
 * Adds pagination steps to an existing aggregation pipeline
 * @param {Array} pipeline The aggregation array which should be paginated
 * @param {number} skip The index of results at which the results should begin returning
 * @param {number} limit The maximum number of readings to return
 */
const paginate = function (pipeline, skip, limit) {
  return pipeline.concat([
    { $sort: { updatedAt: -1 } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        readings: { $push: "$$ROOT" }
      }
    },
    {
      $project: {
        total: true,
        readings: { $slice: ["$readings", skip, limit] }
      }
    }
  ])
}

module.exports = {
  validateQuery: validateQuery,
  baseAggregation: baseAggregation,
  populateProjectAggregation: populateProjectAggregation,
  paginate: paginate
}

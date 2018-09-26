// library imports
const joi = require('joi')

/**
 * Validates query parameters against a query and returns with an object that either does or does not have an `error` property
 * @param {any} requestQuery The req.query passed to the route handler by express
 */
const validateQuery = function(requestQuery) {
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
  _id: true,
  title: true,
  owner_id: true,
  teacher_ids: true,
  "public": true,
  source: true,
  subjects: true,
  grade_levels: true,
  cover_img: true,
  draft: true,
  version_id: true,
  createdAt: true,
  updatedAt: true,
  version_count: true,
  "projects._id": true,
  "projects.reading_id": true,
  "projects.teacher_id": true,
  "projects.label": true,
  "projects.code": true,
  "projects.types": true,
  "projects.createdAt": true,
  "projects.updatedAt": true,
  "projects.students_ids": true
}

/**
 * Gets all of the most recent version of a user's readings and is meant to be expandable by other aggregation pipelines
 * @param {string} userId The user id for which you are searching for readings
 */
const baseAggregation = function(userId) {
  return [
    { $match: { owner_id: userId }},
    { $project: {
        version_count: { $size: "$readings" },
        readings: 1,
        updatedAt: 1
    }},
    { $unwind: "$readings" },
    { $group: {
        _id: "$_id",
        reading: { $last: "$readings" },
        version_count: { $last: "$version_count" },
        updatedAt: { $last: "$updatedAt" },
        promoter_count: { $last: "$promoter_count" }
    }},
    { $sort: { "updatedAt": -1 } },
    { $lookup: {
        from: "readings",
        localField: "reading",
        foreignField: "_id",
        as: "reading"
    }},
    { $unwind: "$reading"},
    { $project: {
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
        version_count: 1
    }}
  ]
}

/**
 * Adds a lookup for readings to the base aggregation
 * @param {string} userId The user's id
 */
const populateProjectAggregation = function(userId) {
  let aggregation = baseAggregation(userId)
  aggregation.push({
    $lookup: {
      from: 'projects',
      localField: '_id',
      foreignField: 'reading_id',
      as: 'projects'
    }
  },
  { "$unwind": "$projects" },
  { $group: {
      _id: "$projects.reading_id",
      title: { $first: "$$ROOT.title" },
      owner_id: { $first: "$$ROOT.owner_id" },
      teacher_ids: { $first: "$$ROOT.teacher_ids" },
      "public": { $first: "$$ROOT.public" },
      source: { $first: "$$ROOT.source" },
      subjects: { $first: "$$ROOT.subjects" },
      grade_levels: { $first: "$$ROOT.grade_levels" },
      cover_img: { $first: "$$ROOT.cover_img" },
      draft: { $first: "$$ROOT.draft" },
      version_id: { $first: "$$ROOT.version_id" },
      createdAt: { $first: "$$ROOT.createdAt" },
      updatedAt: { $first: "$$ROOT.updatedAt" },
      version_count: { $first: "$$ROOT.version_count" },
      "projects": {
        $push: {
          _id: "$projects._id",
          reading_id: "$projects.reading_id",
          teacher_id: "$projects.teacher_id",
          label: "$projects.label",
          code: "$projects.code",
          types: "$projects.types",
          createdAt: "$projects.createdAt",
          updatedAt: "$projects.updatedAt",
          students_ids: "$projects.students_ids",
          comment_count: {
            $size: "$projects.comments"
          },
          student_count: {
            // sum the students and temp students together
            $sum: [ 
              { $size: "$projects.students_ids" },
              { $size: "$projects.temp_ids" }
            ]
          }
        }
      }
    }}
  )
  return aggregation
}

/**
 * Adds pagination steps to an existing aggregation pipeline
 * @param {Array} pipeline The aggregation array which should be paginated
 * @param {number} skip The index of results at which the results should begin returning
 * @param {number} limit The maximum number of readings to return
 */
const paginate = function(pipeline, skip, limit) {
  return pipeline.concat([
    { $sort: { updatedAt: -1 }},
    { $group: {
      _id: null,
      total: { $sum: 1 },
      readings: { $push: "$$ROOT" }
    }},
    { $project: {
      total: true,
      readings: { $slice: ["$readings", skip, limit] }
    }}
  ])
}

module.exports = {
  validateQuery: validateQuery,
  baseAggregation: baseAggregation,
  populateProjectAggregation: populateProjectAggregation,
  paginate: paginate
}
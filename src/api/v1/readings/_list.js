// library imports
const joi = require('joi')

// project imports
const ReadingVersion = require('./../../../models/ReadingVersion')

const validateQuery = function(requestQuery) {
  // the values allowable in the query string
  const queryValues = joi.string().valid([
    'projects'
  ])

  // define the query schema with joi
  const querySchema = joi.object({
      pop: joi.alternatives().try(
          joi.array().items(queryValues),
          queryValues
      )
      .default([]),
      start: joi.number().min(0).max(1000).default(0),
      size: joi.number().min(0).max(50).default(15)
  })

  // run validation with joi
  return joi.validate(requestQuery, querySchema)
}


const baseAggregation = function(userId) {
  return [
    { $match: { owner_id: userId }},
    { $project: {
        versionCount: { $size: "$readings" },
        readings: 1,
        updatedAt: 1
    }},
    { $unwind: "$readings" },
    { $group: {
        _id: "$_id",
        reading: { $last: "$readings" },
        versionCount: { $last: "$versionCount" },
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
        versionCount: 1
    }}
  ]
}

const populateProjectAggregation = function(userId) {
  let aggregation = baseAggregation(userId)
  aggregation.push({
    $lookup: {
      from: 'projects',
      localField: '_id',
      foreignField: 'reading_id',
      as: 'projects'
    }
  }, {
    $project: {
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
      versionCount: true,
      "projects._id": true,
      "projects.reading_id": true,
      "projects.teacher_id": true,
      "projects.label": true,
      "projects.code": true,
      "projects.types": true,
      "projects.createdAt": true,
      "projects.updatedAt": true
    }
  })
  return aggregation
}

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
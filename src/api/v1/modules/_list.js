// library imports
const joi = require('joi')

/**
 * Validates query parameters against a query and returns with an object that either does or does not have an `error` property
 * @param {any} requestQuery The req.query passed to the route handler by express
 */
const validateQuery = function(requestQuery) {
  // the values allowable in the query string
  const popValues = joi.string().valid(['teacher', 'reading'])

  // define the query schema with joi
  const querySchema = joi.object({
    pop: joi
      .alternatives()
      .try(joi.array().items(popValues), popValues)
      .default([]),
    start: joi
      .number()
      .min(0)
      .max(1000)
      .default(0),
    size: joi
      .number()
      .min(1)
      .max(50)
      .default(15),
  })

  // run validation with joi
  return joi.validate(requestQuery, querySchema)
}

// 'reading_id teacher_id label code types tags updatedAt createdAt',

/**
 * Provides an object for the $project phase any time project objects are being passed through the pipeline
 */
const responseShape = {
  _id: true,
  reading_ids: true,
  groups: true,
  teacher_id: true,
  label: true,
  tags: true,
  co_owner_ids: true,
  updatedAt: true,
  createdAt: true,
}

/**
 * Takes a user and returns an array wrapping a $match phase, which starts off the aggregation pipeline
 * @param {User} user the user passed by the req.user
 */
const baseAggregation = function(user) {
  let query
  if (user.type && user.type === 'temp') {
    query = { temp_ids: user._id }
  } else {
    query = {
      $or: [{ students_ids: user._id }, { teacher_id: user._id }],
    }
  }
  return [{ $match: query }]
}

/**
 * An array of aggregation steps which, when applied to an array of projects, should populate the reading with certain properties
 */
const populateReadings = [
  /*{
    $lookup: {
      from: 'readings',
      localField: 'reading_id',
      foreignField: '_id',
      as: 'reading',
    },
  },
  { $unwind: '$reading' },*/
]

const populateTeachers = [
  {
    $lookup: {
      from: 'users',
      localField: 'teacher_id',
      foreignField: '_id',
      as: 'teacher',
    },
  },
  { $unwind: '$teacher' },
]

module.exports = {
  validateQuery: validateQuery,
  baseAggregation: baseAggregation,
  populateReadings: populateReadings,
  responseShape: responseShape,
  populateTeachers: populateTeachers,
}

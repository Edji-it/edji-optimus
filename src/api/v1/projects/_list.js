// library imports
const joi = require('joi')

/**
 * Validates query parameters against a query and returns with an object that either does or does not have an `error` property
 * @param {any} requestQuery The req.query passed to the route handler by express
 */
const validateQuery = function(requestQuery) {
  // the values allowable in the query string
  const popValues = joi.string().valid([
    'teacher',
    'reading'
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

/**
 * Returns the query passed to find the project documents
 * @param {any} user the user passed in from req.query
 */
const baseQuery = function(user) {
  let query
  if (user.type && user.type === 'temp') {
    query = { temp_ids: user._id }
  } else {
    query = { students_ids: user._id }
  }
  return query
}

module.exports = {
  validateQuery: validateQuery,
  baseQuery: baseQuery
}
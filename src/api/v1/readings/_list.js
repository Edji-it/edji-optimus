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
      .default([])
  })

  // run validation with joi
  return joi.validate(requestQuery, querySchema)
}

module.exports = {
  validateQuery: validateQuery
}
// library imports
import joi = require('joi')

export function validateOutcomes(outcomes: any): any {
  let outcome = outcomes ? outcomes[0] : undefined
  
  if (!outcome) {
    return {
      "error": "Bad Request",
      "message": "missing outcomes from request",
      "statusCode": 400
    }
  }

  // Define the schema
  const bodySchema = joi.object({
    standard: joi.string(),
    short_name: joi.string(),
    outcome_statement: joi.string(),
    rubric: joi.array()
  }).and(
    'standard',
    'short_name',
    'outcome_statement',
    'rubric'
  )

  // Run validation on expected request schema with joi
  return joi.validate(outcome, bodySchema)
}

export function validateRubric(outcomes: any): any {
  let rubric = outcomes[0].rubric ? outcomes[0].rubric[0] : undefined
  
  if (!rubric) {
    return {
      "error": "Bad Request",
      "message": "missing rubric from request",
      "statusCode": 400
    }
  }

  // Define the schema
  const rubricSchema = joi.object({
    grade: joi.number(),
    rubric_statement: joi.string()
  }).and(
    'grade',
    'rubric_statement'
  )

  // Run validation on expected request schema with joi
  return joi.validate(rubric, rubricSchema)
}
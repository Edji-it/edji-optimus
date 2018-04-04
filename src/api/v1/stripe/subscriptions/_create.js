// library imports
const joi = require('joi')

// project imports
const _stripe = require('./../_stripe')

/**
 * Validates query parameters against a query and returns with an object that either does or does not have an `error` property
 * @param {Object} reqBody The req.query passed to the route handler by express
 */
const validateBody = function(reqBody) {
  const bodySchema = joi.object({
    token: joi.string(),
    couponCode: joi.string()
  }).or('token', 'couponCode')

  return joi.validate(reqBody, bodySchema)
}

module.exports = {
  validateBody: validateBody
}
// library imports
const joi = require('joi')

/**
 * Validates query parameters against a query and returns with an object that either does or does not have an `error` property
 * @param {Object} reqBody The req.query passed to the route handler by express
 */
const validateBody = function(reqBody) {
  const bodySchema = joi.object({
    token: joi.string(),
    subscriptionType: joi.string().required(),
    couponCode: joi.string().required()
  })

  return joi.validate(reqBody, bodySchema)
}

module.exports = {
  validateBody: validateBody
}
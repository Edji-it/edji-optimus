// library imports
import * as joi from 'joi'

/**
 * Validates query parameters against a query and returns with an object that either does or does not have an `error` property
 * @param {Object} reqBody The req.query passed to the route handler by express
 */
const validateBody = function(reqBody) {
  if (reqBody.token == '') {
    delete reqBody.token
  }

  const bodySchema = joi
    .object({
      token: joi.string(),
    })
    .or('token')

  return joi.validate(reqBody, bodySchema)
}

export default validateBody

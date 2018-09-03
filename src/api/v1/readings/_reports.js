// library imports
const joi = require('joi')

/**
 * Validates query parameters against a query and returns with an object that either does or does not have an `error` property
 * @param {Object} reqBody The req.query passed to the route handler by express
 */
const validateBody = function(reqBody) {
  if (reqBody.token == '') {
    delete reqBody.token
  }

  const bodySchema = joi.object({
    email: joi.string(),
    evaluation: joi.string(),
    person_sharing: joi.string(),
    replyTo: joi.string(),
    person_receiving: joi.string(),
    attachment_name: joi.string(),
    pdf: joi.string(),
    reading_name: joi.string()
  }).or('email', 'evaluation', 'person_sharing', 'replyTo', 'person_receiving', 'attachment_name', 'pdf', 'reading_name')

  return joi.validate(reqBody, bodySchema)
}

module.exports = {
  validateBody: validateBody
}
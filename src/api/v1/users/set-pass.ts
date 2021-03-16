// library imports
import { RequestHandler } from 'express'
import * as joi from 'joi'
import _ = require('underscore')

// project imports
import { generateLoginObjectForUser } from './../../../middleware/login-controller'

const resetSchema = joi.object().keys({
  email: joi.string().required(),
  new_password: joi.string().required(),
})

const setPasswordHandler: RequestHandler = async (req, res, next) => {
  const user = req.user

  // validation
  if (!user.password && user.type === 'temp') {
    let error = new Error('no password for user')
    if (user.type === 'temp') error.message += '; user is a temp'
    error.name = 'err_no_password'
    return res.status(400).send(error)
  }

  const { error, value } = joi.validate(req.body, resetSchema)
  if (error) return res.status(400).send(error)

  try {
    // Check to see if email matches
    if (value.email !== user.email) {
      return res.status(403).send()
    }
    // update user
    user.password = value.new_password
    await user.edjiSave()
    return res.status(200).send(generateLoginObjectForUser(user))
  } catch (err) {
    return next(err)
  }
}

export default setPasswordHandler

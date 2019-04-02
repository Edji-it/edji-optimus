// library imports
import { RequestHandler } from 'express'
import * as joi from 'joi'

// project imports
import { comparePasswords, generateLoginObjectForUser } from './../../../middleware/login-controller'

const resetSchema = joi.object().keys({
  old_password: joi.string().required(),
  new_password: joi.string().required()
})

const changePasswordHandler: RequestHandler = async (req, res, next) => {
  const user = req.user

  // validation
  if (!user.password) {
    let error = new Error('no password for user')
    if (user.type === 'temp') error.message += '; user is a temp'
    error.name = 'err_no_password'
    return res.status(400).send(error)
  }

  const { error, value } = joi.validate(req.body, resetSchema)
  if (error) return res.status(400).send(error)

  try {
    // verify password
    const match = await comparePasswords(value.old_password, user.password)
    if (!match) {
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

export default changePasswordHandler
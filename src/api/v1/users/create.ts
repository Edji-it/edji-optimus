// library imports
import { RequestHandler } from 'express'

// project imports
import * as User from './../../../models/User'
import * as Referral from './../../../models/Referral'
import { generateLoginObjectForUser } from './../../../middleware/login-controller'
import { cleanMongoValidationError } from './../../../error-handlers'

const createController: RequestHandler = async function(req, res, next) {
  let userData: any = req.body.user

  try {
    let user: any = await User(userData).edjiSave({ forceSave: true })
    // update the referring user's Referral object to reflect their referral
    if (user.referred_by) {
      await Referral.findOneAndUpdate(
        { code: user.referred_by },
        {
          $push: {
            users_referred: {
              user_id: user._id,
              status: 'registered',
            },
          },
        },
      )
    }
    return res.status(201).send(generateLoginObjectForUser(user))
  } catch (error) {
    // constructs object with list of model-defined errors to send to user
    if (error.name === 'ValidationError') {
      let validationErrors = cleanMongoValidationError(error)
      return res.status(406).send({ validationErrors })
    } else if (error.code === 11000) {
      return res.status(409).send(duplicateFieldErrorHandler(error))
    } else {
      return next(error)
    }
  }
}

export default createController

/**
 * a helper function which cleans a mongo error and returns it in a format that the front end is expecting
 * @param error error returned by mongodb
 */
export function duplicateFieldErrorHandler(error) {
  // this is going to be a little hacky
  // we need to have all the possible duplicate indexes handled manually, unfortunately, since it doesn't give us the index
  let path
  if (error.message.indexOf('username') > -1) {
    path = 'username'
  } else if (error.message.indexOf('email') > -1) {
    path = 'email'
  }

  let message
  if (path) {
    message = 'duplicate key error for field: ' + path
  } else {
    message = 'error in determining duplicate path'
    throw new Error('a duplicate error was returned, but it could not be identified.')
  }

  return {
    duplicateFieldError: {
      message: message,
      field: path,
    },
  }
}

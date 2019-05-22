import { Request, Response, NextFunction } from 'express'
import User from '../../../../models/User'

export async function ValidateTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  let { reset_property, unhashed_token } = req.params
  let resetValue: string = req.body[reset_property]
  let { user } = req

  if (!reset_property || !unhashed_token) {
    return res
      .status(400)
      .send({ error: `cannot use token ${reset_property}, as reset_property and unhashed_token do not both exist` })
  }
  if (!resetValue || typeof resetValue !== 'string') {
    return res.status(400).send({ error: `${reset_property} required and must be a string` })
  }

  // if the user isn't attached to the request, like in the case of password reset, go and find it using the token
  if (!user) {
    let { user_id } = req.query
    // if we can't find the user we'll just stop
    if (!user_id) {
      return res.status(400).send({ error: 'unauthenticated requests must specific a correct user_id' })
    }
    try {
      user = await User.findById(user_id)
    } catch (err) {
      return next(err)
    }
    req.user = user
    // if there's not a user that is under that id, get out!
    if (!user) return res.status(404).send()
  }

  try {
    await user.validateOneTimeToken(`reset_${reset_property}`, unhashed_token)
    // if this passes, this is where we want to do token-specific logic, such as actually changing or verifying a user's email
    return next()
  } catch (err) {
    switch (err.message) {
      case 'ERR_INVALID_PROPERTY':
        return res.status(400).send({ error: `requested token be set for invalid property name: ${reset_property}` })
      case 'ERR_INVALID_TOKEN':
        return res.status(400).send({ error: 'token found to be invalid' })
      default:
        // handle any other errors by sending 500 and logging to sentry
        return next(err)
    }
  }
}

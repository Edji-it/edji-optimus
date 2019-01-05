import { Request, Response, NextFunction } from 'express'

export async function UseTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  let { reset_property, unhashed_token } = req.params
  let user = req.user

  if (!reset_property || !unhashed_token) {
    return res.status(400).send({ error: `cannot use token ${reset_property}, as reset_property and unhashed_token do not both exist` })
  }

  try {
    await user.useOneTimeToken(`reset_${reset_property}`, unhashed_token)
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
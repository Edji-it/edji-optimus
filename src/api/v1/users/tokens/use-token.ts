import { Request, Response, NextFunction } from 'express'

export async function UseTokenController(req: Request, res: Response, next: NextFunction) {
  let { token_name, unhashed_token } = req.params
  let user = req.user

  if (!token_name || !unhashed_token) {
    return res.status(400).send({ error: `cannot use token ${token_name}, as token_name and unhashed_token do not both exist` })
  }

  try {
    await user.useOneTimeToken(token_name, unhashed_token)
    // if this passes, this is where we want to do token-specific logic, such as actually changing or verifying a user's email
    return next()
  } catch (err) {
    switch (err.message) {
      case 'ERR_INVALID_PROPERTY':
        return res.status(400).send({ error: `requested token be set for invalid property name: ${token_name}` })
      case 'ERR_INVALID_TOKEN':
        return res.status(400).send({ error: 'token found to be invalid' })
      default:
        // handle any other errors by sending 500 and logging to sentry
        return next(err)
    }
  }
}
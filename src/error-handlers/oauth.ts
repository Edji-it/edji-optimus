import { Request, Response, NextFunction } from 'express'

// not sure why I had to explicitly 
export function OAuthMiddleware(err: Express.Errback, req: Request, res: Response, next: NextFunction) {
  if (err && err.type && err.type === 'google' || err.type === 'clever') {
    // switch (err.code) {
    // case "err_duplicate_user":
    // const redirect = req.protocol + ":" + process.env.CLIENT_URL + "/#/oauth/google?error=duplicate_user"
    // const redirect = 
    return res.redirect(`${req.protocol}:${process.env.CLIENT_URL}/#/oauth/${err.type}?error=duplicate_user`) // return out because we don't want this error caught in sentry
    // default:
    next(err)
    // }
  } else {
    next(err)
  }
}
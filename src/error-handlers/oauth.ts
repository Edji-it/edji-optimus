import { ErrorRequestHandler } from 'express'

// not sure why I had to explicitly 
export const OAuthMiddleware: ErrorRequestHandler = function (err, req, res, next) {
  if (err && err.name === 'err_duplicate_user' && err.redirect_to) {
    return res.redirect(err.redirect_to) // return out because we don't want this error caught in sentry
  } else {
    next(err)
  }
}
// library imports
import { Request, Response, NextFunction, RequestHandler } from 'express'
import { captureException } from '@sentry/node'

// project imports
import { getRedirectURI, getTokenRedirectDestination, GOOGLE_URI } from './oauth'

export const GoogleRedirect: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  return res.redirect(GOOGLE_URI)
}

export const CallbackHandler: RequestHandler = async (req, res, next) => {
  const { code } = req.query
  const { type } = req.params
  try {
    const destination = await getTokenRedirectDestination(type, code)
    return res.redirect(destination)
  } catch (err) {
    process.env.NODE_ENV !== 'production' && console.error(err)
    captureException(err)
    return res.redirect(getRedirectURI({ type, error: 'serverError' }))
  }
}

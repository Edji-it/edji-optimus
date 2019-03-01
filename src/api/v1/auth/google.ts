// library imports
import { Request, Response, NextFunction } from 'express'
import * as Passport from './../../../passport'

export const GoogleRedirect = Passport.authenticate('google', { scope: ['email', 'profile'] })

export const GoogleCallback: Array<(req: Request, res: Response, next: NextFunction) => void> = [
  Passport.authenticate('google', { session: false }),
  (req, res, next) => {
    const { oauth_error } = req
    if (oauth_error) {
      // if there's a duplicate user, we handle by sending them to a page where they could link their account
      if (oauth_error.name === 'err_duplicate_user') {
        const encodedToken = encodeURIComponent(req.user.oauth[0].singleUseToken)
        return res.redirect(`${req.protocol}:${process.env.CLIENT_URL}/#/oauth/clever?error=duplicate_user&token=${encodedToken}`)
      }
      return res.status(400).send(req.oauth_error)
    }

    const oauthToken = encodeURIComponent(
      req.user.oauth.find((obj) => {
        return obj.type === 'google'
      }).singleUseToken
    )

    // should be changed to use req.baseUrl
    const redirect = req.protocol + ":" + process.env.CLIENT_URL + '/#/oauth/google?token=' + oauthToken

    return res.redirect(redirect)
  }
]
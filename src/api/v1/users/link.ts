// library imports
import { Request, Response, NextFunction } from 'express'

// project imports
import * as User from './../../../models/User'
import * as LoginController from './../../../middleware/LoginController'

export default async function LinkAccounts(req: Request, res: Response, next: NextFunction) {
  const { user } = req // this is the user that's logged in, which we'll be merging the oauth account into
  const { oauth_type, oauth_token, oauth_id } = req.query
  if (!oauth_token || !oauth_type) {
    return res.status(400).send({ error: 'oauth_token and oauth_type are required query parameters' })
  }

  try {

    const oauthUser = await User.findOne({
      'oauth.singleUseToken': oauth_token,
      'oauth.singleUseTokenExpiration': { $gte: Date.now() },
      'oauth.type': oauth_type
    })

    if (!oauthUser) {
      // Create new oAuth object
      let oauthObj = {
        'id': oauth_id,
        'type': oauth_type,
        'email': user.email
      }
      user.oauth.push(oauthObj)
    } else {
      // Transfer oAuth object from existing oAuth account
      user.oauth.push(oauthUser.oauth[0])
    }
    await user.edjiSave()
    if (oauthUser) {
      await oauthUser.remove()
    }
    return res.status(200).send(LoginController.generateLoginObjectForUser(user))
  } catch (err) {
    return next(err)
  }
}
// library imports
import { Request, Response, NextFunction } from 'express'

// project imports
import User, { UserDocument } from '../../../models/User'
import { generateLoginObjectForUser } from './../../../middleware/login-controller'

export default async function LinkAccounts(req: Request, res: Response, next: NextFunction) {
  const { user } = req // this is the user that's logged in, which we'll be merging the oauth account into
  const { oauth_type, oauth_token } = req.query
  if (!oauth_token || !oauth_type) {
    return res.status(400).send({ error: 'oauth_token and oauth_type are required query parameters' })
  }

  try {
    const oauthUser: UserDocument = await User.findOne({
      'pending_oauth.singleUseToken': oauth_token,
      'pending_oauth.singleUseTokenExpiration': { $gte: Date.now() },
      'pending_oauth.type': oauth_type,
    }).lean()
    if (!oauthUser || !user._id.equals(oauthUser._id)) {
      return res.status(403).send()
    }
    if (!user.oauth) user.oauth = []
    user.oauth.push({ ...oauthUser.pending_oauth })
    user.pending_oauth = null
    await user.edjiSave()
    return res.status(200).send(generateLoginObjectForUser(user))
  } catch (err) {
    return next(err)
  }
}

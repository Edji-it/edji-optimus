// library imports
import { Request, Response, NextFunction } from 'express'
import { create } from 'simple-oauth2'
// import { hash } from 'bcryptjs'

// project imports
import Clever from './../../../services/clever'
import * as User from './../../../models/User'

const creds = {
  client: {
    id: process.env.OAUTH2_CLEVER_CLIENT_ID,
    secret: process.env.OAUTH2_CLEVER_CLIENT_SECRET
  },
  auth: {
    tokenHost: 'https://clever.com'
  }
}

const oauth2 = create(creds)
const redirect_uri = `http:${process.env.OPTIMUS_URL}/api/v1/auth/clever/callback`

/**
 * @todo implement state for CORS security
 */
// Authorization oauth2 URI
const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri,
  // scope: '<scope>', // clever auto-assigns scope for library apps
  // state: '<state>' //
})

export function CleverRedirect(req: Request, res: Response, next: NextFunction) {
  return res.redirect(authorizationUri)
}

export async function CleverCallback(req: Request, res: Response, next: NextFunction) {
  // Get the access token object (the authorization code is given from the previous step).
  const tokenConfig = {
    code: req.query.code,
    redirect_uri
  }
  try {
    const { access_token } = await oauth2.authorizationCode.getToken(tokenConfig)
    const client = new Clever(access_token)
    await client.init()
    const profile = await client.getEdjiUserShape()

    // attempt to find an existing user with the matching id and set a singleuse login token for us to log them in with
    let user = await User.findOneAndUpdate(
      {
        'oauth.id': client.userId,
        'oauth.type': 'clever'
      },
      {
        $set: {
          'oauth.$.singleUseToken': profile.oauth[0].singleUseToken,
          'oauth.$.singleUseTokenExpiration': profile.oauth[0].singleUseTokenExpiration
        }
      },
      {
        new: true,
        runValidators: true
      }
    )
    if (!user) {
      user = User(profile)
      await user.edjiSave()
    }

    const redirect = 'http:' + process.env.CLIENT_URL + '/#/oauth/clever?token=' + encodeURIComponent(profile.oauth[0].singleUseToken)

    return res.redirect(redirect)
  } catch (err) {
    next({ error: err, type: "clever", code: "err_duplicate_user" })
  }
}
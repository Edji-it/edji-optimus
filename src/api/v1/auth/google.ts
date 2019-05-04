// library imports
import { Request, Response, NextFunction, RequestHandler } from 'express'
import { create, ModuleOptions, AuthorizationTokenConfig } from 'simple-oauth2'
import { google } from 'googleapis'

import User from '../../../models/User'
import { generateOAuthObject, getRedirectURI } from './oauth'

const creds: ModuleOptions = {
  client: {
    id: process.env.OAUTH2_GOOGLE_CLIENT_ID,
    secret: process.env.OAUTH2_GOOGLE_CLIENT_SECRET,
  },
  auth: {
    tokenHost: 'https://www.googleapis.com',
    tokenPath: '/oauth2/v4/token',
    authorizeHost: 'https://accounts.google.com',
    authorizePath: '/o/oauth2/v2/auth',
  },
}

const { CLIENT_URL: clientUrl } = process.env
const type = 'google'
const oauth2 = create(creds)
const protocol = process.env.NODE_ENV === 'local' ? 'http' : 'https'
const redirect_uri = `${protocol}:${process.env.OPTIMUS_URL}/api/v1/auth/google/callback`

/**
 * @todo implement state for CORS security
 */
// Authorization oauth2 URI
const authorizationUri = oauth2.authorizationCode.authorizeURL({
  redirect_uri,
  scope: ['https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'],
  // state: '<state>'
})

export const GoogleRedirect: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  return res.redirect(authorizationUri)
}

export const GoogleCallback: RequestHandler = async (req, res, next) => {
  const { protocol } = req
  try {
    const tokenConfig: AuthorizationTokenConfig = {
      code: req.query.code,
      redirect_uri,
    }
    const { access_token } = await oauth2.authorizationCode.getToken(tokenConfig)
    const people = google.people({
      version: 'v1',
    })
    const { data } = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names,photos,metadata',
      oauth_token: access_token,
    })
    const { names, photos, emailAddresses, metadata } = data
    // get user's id
    const { id } = metadata.sources.find(source => source.type === 'PROFILE')
    // find display name
    const { displayName: fullname } = names.find(name => name.metadata.primary)
    // find photo, if exists
    const { url: avatar } = photos.find(photo => photo.metadata.primary)
    // find email address
    const { value: email } = emailAddresses.find(email => email.metadata.primary)
    const authObj = generateOAuthObject(id, type)
    const { singleUseToken } = authObj
    const existingUser = await User.findAndGenerateOAuthLogin(authObj)
    if (existingUser) return res.redirect(getRedirectURI({ protocol, clientUrl, type, singleUseToken }))
    // const oauthObj = generateOAuthObject(id, 'google')
    // const user = User({
    //   fullname,
    //   email,
    //   avatar,
    //   oauth: [
    //     {
    //       type: 'google',
    //       id,
    //       singleUseToken: 'something',
    //       singleUseTokenExpiration: 'something',
    //     },
    //   ],
    // })
    res.status(200).send(existingUser)
  } catch (err) {
    next(err)
  }
}

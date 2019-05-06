// library imports
export const tester = () => ''
import { stringify } from 'querystring'
import { create, ModuleOptions, AuthorizationTokenConfig } from 'simple-oauth2'
import { RequestHandler, Response } from 'express'

// project imports
import User, { fromGoogleUser, OAuthType, UserDocument, OAuthObject } from './../../../models/User'
import { getGoogleInfo } from './../../../services/google'

// constants
const { CLIENT_URL: clientUrl } = process.env
const PROTOCOL = process.env.NODE_ENV === 'local' ? 'http' : 'https'

const googleCreds: ModuleOptions = {
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
const googleOAuth2 = create(googleCreds)
const GOOGLE_REDIRECT_URI = `${PROTOCOL}:${process.env.OPTIMUS_URL}/api/v1/auth/google/callback`
/**
 * @todo add state param for cross-origin scripting protection
 */
export const GOOGLE_URI = googleOAuth2.authorizationCode.authorizeURL({
  redirect_uri: GOOGLE_REDIRECT_URI,
  scope: ['https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'],
  // state: '<state>'
})

export const getRedirectURI = ({ type, singleUseToken, error }: RedirectParams): string => {
  let query: any = {}
  if (error) query.error = error
  if (singleUseToken) query.token = singleUseToken
  return `${PROTOCOL}:${clientUrl}/#/oauth/${type}?${stringify(query)}`
}

// export const getUser = async (type: string, code: string): OAuthUserGetter => {
export const getUser = async (type: string, code: string) => {
  switch (type) {
    case 'google':
      const tokenConfig: AuthorizationTokenConfig = {
        code,
        redirect_uri: GOOGLE_REDIRECT_URI,
      }
      const { access_token } = await googleOAuth2.authorizationCode.getToken(tokenConfig)
      const profile = await getGoogleInfo(access_token)
      return fromGoogleUser(profile)
    case 'clever':
      break
  }
}

export const getTokenRedirectDestination = async (type: OAuthType, code: string): Promise<string> => {
  return ''
  //   const { user, oauthObj } = await getUser(type, code)
  //   const { singleUseToken } = oauthObj
  //   const existingUser = await User.findAndGenerateOAuthLogin(oauthObj)
  //   if (existingUser) return getRedirectURI({ type, singleUseToken })

  //   try {
  //     await user.edjiSave()
  //     return getRedirectURI({ type, singleUseToken })
  //   } catch (err) {
  //     if (err.code && err.code === 11000) {
  //       // there's an account causing a duplicate error because the email is not unique (existing account)
  //       // the user initiating this workflow has an email in their oauth provider which is causing a duplicate email error
  //       // the only path we allow from here is for the initiating user to go back and log into their other account in order to link their new oauth provider
  //       // in order to do that, we are saving the initiating user's oauth information to the duplicate user's account. If they log in with that new account
  //       // and have the correct token, then we'll promote this pending_oauth object to the real deal!
  //       await User.setPendingOAuth({ email: user.email, oauthObj })
  //       return getRedirectURI({ type, singleUseToken, error: 'duplicate_user' })
  //     } else {
  //       throw err
  //     }
  //   }
}

// export const redirectUser: RequestHandler = async (req, res, next) => {
//   const { type } = req.params
//   const { oauthObj, oauthUser: user } = req.context
//   const { singleUseToken } = oauthObj
//   const existingUser = await User.findAndGenerateOAuthLogin(oauthObj)
//   if (existingUser) return res.redirect(getRedirectURI({ type, singleUseToken }))

//   try {
//     await user.edjiSave()
//     return res.redirect(getRedirectURI({ type, singleUseToken }))
//   } catch (err) {
//     if (err.code && err.code === 11000) {
//       // there's an account causing a duplicate error because the email is not unique (existing account)
//       // the user initiating this workflow has an email in their oauth provider which is causing a duplicate email error
//       // the only path we allow from here is for the initiating user to go back and log into their other account in order to link their new oauth provider
//       // in order to do that, we are saving the initiating user's oauth information to the duplicate user's account. If they log in with that new account
//       // and have the correct token, then we'll promote this pending_oauth object to the real deal!
//       await User.setPendingOAuth({ email: user.email, oauthObj })
//       return res.redirect(getRedirectURI({ type, singleUseToken, error: 'duplicate_user' }))
//     } else {
//       throw err
//     }
//   }
// }

// export async function handleDuplicateUser(user: UserDocument) {
//   const existingUser = await User.findAndGenerateOAuthLogin(oauthObj)
//   if (existingUser) return res.redirect(getRedirectURI({ type: TYPE, singleUseToken }))

//   try {
//     await user.edjiSave()
//     return res.redirect(getRedirectURI({ type: TYPE, singleUseToken }))
//   } catch (err) {
//     if (err.code && err.code === 11000) {
//       // there's an account causing a duplicate error because the email is not unique (existing account)
//       // the user initiating this workflow has an email in their oauth provider which is causing a duplicate email error
//       // the only path we allow from here is for the initiating user to go back and log into their other account in order to link their new oauth provider
//       // in order to do that, we are saving the initiating user's oauth information to the duplicate user's account. If they log in with that new account
//       // and have the correct token, then we'll promote this pending_oauth object to the real deal!
//       await User.setPendingOAuth({ email: user.email, oauthObj })
//       return res.redirect(getRedirectURI({ type: TYPE, singleUseToken, error: 'duplicate_user' }))
//     } else {
//       throw err
//     }
//   }
// }

type OAuthUserGetter = Promise<{ user: UserDocument; oauthObj: OAuthObject }>

export interface RedirectParams {
  type: OAuthType
  singleUseToken?: string
  error?: 'duplicate_user' | 'serverError' // I know... this is ugly with the camel case and underscore case
}

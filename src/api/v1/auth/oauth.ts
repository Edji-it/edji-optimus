// library imports
import { stringify } from 'querystring'
import { create, ModuleOptions, AuthorizationTokenConfig, OAuthClient } from 'simple-oauth2'
import { captureException } from '@sentry/node'
import { RequestHandler } from 'express'

// project imports
import User, { fromOAuthUser, OAuthType } from './../../../models/User'
import { getGoogleInfo } from './../../../services/google'
import Clever from '../../../services/clever'

const creds: { [key in OAuthType]: ModuleOptions } = {
  google: {
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
  },
  clever: {
    client: {
      id: process.env.OAUTH2_CLEVER_CLIENT_ID,
      secret: process.env.OAUTH2_CLEVER_CLIENT_SECRET,
    },
    auth: {
      tokenHost: 'https://clever.com',
    },
  },
}

export const createOAuthClient = (type: OAuthType): OAuthClient => {
  return create(creds[type])
}

const GOOGLE_REDIRECT_URI = `${getProtocol()}:${process.env.OPTIMUS_URL}/api/v1/auth/google/callback`
const CLEVER_REDIRECT_URI = `${getProtocol()}:${process.env.OPTIMUS_URL}/api/v1/auth/clever/callback`

/**
 * @todo add state param for cross-origin scripting protection
 */
const providerRedirects: { [key in OAuthType]: string } = {
  google: createOAuthClient('google').authorizationCode.authorizeURL({
    redirect_uri: GOOGLE_REDIRECT_URI,
    scope: ['https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'],
    // state: '<state>'
  }),
  clever: createOAuthClient('clever').authorizationCode.authorizeURL({
    redirect_uri: CLEVER_REDIRECT_URI,
    // scope: '<scope>', // clever auto-assigns scope for library apps
    // state: '<state>'
  }),
}

function getProtocol(): 'http' | 'https' {
  return process.env.EDJI_STAGE === 'local' ? 'http' : 'https'
}

export const getRedirectURI = ({ type, singleUseToken, error }: RedirectParams): string => {
  let query: any = {}
  if (error) query.error = error
  if (singleUseToken) query.token = singleUseToken
  return `${getProtocol()}:${process.env.CLIENT_URL}/#/oauth/${type}?${stringify(query)}`
}

export const getUser = async (type: OAuthType, code: string) => {
  switch (type) {
    case 'google':
      const googleOAuth2 = createOAuthClient('google')
      const googleTokenConfig: AuthorizationTokenConfig = {
        code,
        redirect_uri: GOOGLE_REDIRECT_URI,
      }
      const { access_token: googleToken } = await googleOAuth2.authorizationCode.getToken(googleTokenConfig)
      const profile = await getGoogleInfo(googleToken)
      return fromOAuthUser(profile, 'google')
    case 'clever':
      const cleverClient = createOAuthClient('clever')
      const tokenConfig: AuthorizationTokenConfig = {
        code: code,
        redirect_uri: CLEVER_REDIRECT_URI,
      }
      const { access_token: cleverToken } = await cleverClient.authorizationCode.getToken(tokenConfig)
      const client = new Clever(cleverToken)
      await client.init()
      const cleverProfile = await client.getCleverInfo()
      return fromOAuthUser(cleverProfile, 'clever')
  }
}

export const getTokenRedirectDestination = async (type: OAuthType, code: string): Promise<string> => {
  try {
    const { user, oauthObj } = await getUser(type, code)
    const { singleUseToken } = oauthObj
    const existingUser = await User.findAndGenerateOAuthLogin(oauthObj)
    if (existingUser) return getRedirectURI({ type, singleUseToken })
    try {
      await user.edjiSave()
      return getRedirectURI({ type, singleUseToken })
    } catch (err) {
      if (err.code && err.code === 11000) {
        // there's an account causing a duplicate error because the email is not unique (existing account)
        // the user initiating this workflow has an email in their oauth provider which is causing a duplicate email error
        // the only path we allow from here is for the initiating user to go back and log into their other account in order to link their new oauth provider
        // in order to do that, we are saving the initiating user's oauth information to the duplicate user's account. If they log in with that new account
        // and have the correct token, then we'll promote this pending_oauth object to the real deal!
        await User.setPendingOAuth({ email: user.email, oauthObj })
        return getRedirectURI({ type, singleUseToken, error: 'duplicate_user' })
      } else {
        throw err
      }
    }
  } catch (err) {
    captureException(err)
    return getRedirectURI({ type, error: 'serverError' })
  }
}

export const oauthCallbackHandler: RequestHandler = async (req, res, next) => {
  try {
    const { code } = req.query
    const { type } = req.params
    const destination = await getTokenRedirectDestination(type, code)
    return res.redirect(destination)
  } catch (err) {
    return next(err)
  }
}

export const redirectToProvider: RequestHandler = async (req, res, next) => {
  try {
    const { type } = req.params
    return res.redirect(providerRedirects[type])
  } catch (err) {
    return next(err)
  }
}
export interface RedirectParams {
  type: OAuthType
  singleUseToken?: string
  error?: 'duplicate_user' | 'serverError' // I know... this is ugly with the camel case and underscore case
}

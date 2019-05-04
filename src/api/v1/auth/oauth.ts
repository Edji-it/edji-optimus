import { hashSync } from 'bcryptjs'
import { stringify } from 'querystring'

export const generateOAuthObject = (id: string | number, type: OauthType): OAuthObject => {
  return {
    id,
    type,
    singleUseToken: hashSync(id + Date.now().toString(), 4),
    singleUseTokenExpiration: Date.now() + 1000 * 60,
  }
}

export const getRedirectURI = ({ protocol, clientUrl, type, singleUseToken, error }: RedirectParams) => {
  let query: any = {}
  if (error) query.error = error
  if (singleUseToken) query.token = singleUseToken
  return `${protocol}:${clientUrl}/#/oauth/${type}?${stringify(query)}`
}

export interface RedirectParams {
  protocol: string
  clientUrl: string
  type: OauthType
  singleUseToken?: string
  error?: 'duplicate_user' | 'serverError' // I know... this is ugly with the camel case and underscore case
}

// export const findOauthUser = ({ id, type, singleUseToken, singleUseTokenExpiration }: OAuthObject): Promise<any> => {
//   return User.findOneAndUpdate(
//     {
//       'oauth.id': id,
//       'oauth.type': type,
//     },
//     {
//       $set: {
//         'oauth.$.singleUseToken': singleUseToken,
//         'oauth.$.singleUseTokenExpiration': singleUseTokenExpiration,
//       },
//     },
//     {
//       new: true,
//       runValidators: true,
//     },
//   ).exec()
// }

export interface OAuthObject {
  id: string | number
  type: OauthType
  singleUseToken: string
  singleUseTokenExpiration: number
}

type OauthType = 'google' | 'clever'

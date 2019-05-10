// library imports
import { Request, Response, NextFunction } from 'express'
import { create, ModuleOptions, AuthorizationTokenConfig } from 'simple-oauth2'
import { captureException } from '@sentry/node'

// project imports
import Clever from './../../../services/clever'
import User from '../../../models/User'
import { sendUserDetails } from './../../../services/bumblebee'

const creds: ModuleOptions = {
  client: {
    id: process.env.OAUTH2_CLEVER_CLIENT_ID,
    secret: process.env.OAUTH2_CLEVER_CLIENT_SECRET,
  },
  auth: {
    tokenHost: 'https://clever.com',
  },
}

const oauth2 = create(creds)
const protocol = process.env.NODE_ENV === 'local' ? 'http' : 'https'
const redirect_uri = `${protocol}:${process.env.OPTIMUS_URL}/api/v1/auth/clever/callback`

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

// export async function CleverCallback(req: Request, res: Response, next: NextFunction) {
//   // Get the access token object (the authorization code is given from the previous step).
//   const tokenConfig: AuthorizationTokenConfig = {
//     code: req.query.code,
//     redirect_uri,
//   }
//   try {
//     const { access_token } = await oauth2.authorizationCode.getToken(tokenConfig)
//     const client = new Clever(access_token)
//     await client.init()
//     const profile = await client.getEdjiUserShape()

//     // attempt to find an existing user with the matching id and set a singleuse login token for us to log them in with
//     let user = await User.findOneAndUpdate(
//       {
//         'oauth.id': client.userId,
//         'oauth.type': 'clever',
//       },
//       {
//         $set: {
//           'oauth.$.singleUseToken': profile.oauth[0].singleUseToken,
//           'oauth.$.singleUseTokenExpiration': profile.oauth[0].singleUseTokenExpiration,
//         },
//       },
//       {
//         new: true,
//         runValidators: true,
//       },
//     )
//     const encodedToken: string = encodeURIComponent(profile.oauth[0].singleUseToken)
//     if (!user) {
//       user = new User(profile)
//       await user.validate()
//       try {
//         await user.edjiSave()
//       } catch (err) {
//         if (err.code && err.code === 11000) {
//           // there's an account causing a duplicate error because the email is not unique (existing account)
//           // the user initiating this workflow has an email in their oauth provider which is causing a duplicate email error
//           // the only path we allow from here is for the initiating user to go back and log into their other account in order to link their new oauth provider
//           // in order to do that, we are saving the initiating user's oauth information to the duplicate user's account. If they log in with that new account
//           // and have the correct token, then we'll promote this pending_oauth object to the real deal!
//           await User.updateOne(
//             { email: user.email },
//             {
//               $set: {
//                 pending_oauth: user.oauth[0],
//               },
//             },
//           )
//         } else {
//           throw err
//         }
//         return res.redirect(
//           `${req.protocol}:${process.env.CLIENT_URL}/#/oauth/clever?error=duplicate_user&token=${encodedToken}`,
//         )
//       }
//       sendUserDetails(user)
//     }
//     return res.redirect(`${req.protocol}:${process.env.CLIENT_URL}/#/oauth/clever?token=${encodedToken}`)
//   } catch (err) {
//     process.env.NODE_ENV !== 'production' && console.error(err)
//     captureException(err)
//     return res.redirect(`${req.protocol}:${process.env.CLIENT_URL}/#/oauth/clever?error=serverError`)
//   }
// }

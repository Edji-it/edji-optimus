// Library Imports
import { Request, Response, NextFunction } from 'express'

// Project Imports
import User = require('../../../../models/User')
import { createQuery, userCanResetPass } from './_find-user'

export async function PasswordHandler(req: Request, res: Response, next: NextFunction) {
  // since this is only called on the password route, set this param which will be used in further middleware
  req.params.reset_property = 'password'

  // if the user is already logged in, skip the search and move on
  if (req.user) {
    return next()
  }

  let { username, email } = req.query
  if (!username && !email) {
    // if no username nor email is passed in, then we have to send this back
    return res.status(400).send({ error: 'username or email not sent when requesting password' })
  }
  /**
   * If the user is not logged in, then we will need to verify they exist
   * We need to make sure they passed in either a username or email address to conduct the search
   * One example why we need this is for the users that have forgotten a password and are not able to log in
   * */
  let query: any = createQuery(req.query)


  try {
    let user: any = await User.findOne(query)

    if (!user) {
      // we don't want them to be able to locate users just with a random username or email
      return res.status(404).send()
    }

    // error cases where the user doesnt have username/password
    if (!userCanResetPass(user)) {
      if (user.oauth && user.oauth.length > 0) {
        // pull oauth types out of array
        let types = user.oauth.map(({ type }) => {
          return type
        })

        return res.status(400).send({
          error: 'NO_LOGIN_CREDENTIALS',
          message: 'user has no username/password, but has at least one oauth account that could be used to log in',
          oauth_types: types
        })
      } else {
        let ERROR = 'account has no credentials or oauth: ' + user._id
        return next(ERROR)
      }
    }
    // attach the user to the request so we can use this in the next stage
    req.user = user
    return next()
  } catch (err) {
    return next(err)
  }
}

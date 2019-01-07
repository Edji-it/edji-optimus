// Library Imports
import { Request, Response, NextFunction } from 'express'

// Project Imports
import User = require('../../../models/User')
import { createQuery, userCanResetPass } from './_find-user'

export async function findUser(req: Request, res: Response, next: NextFunction) {
  // if the user is already logged in, skip the search and move on
  if (req.user) {
    next()
  } else {
    if (!req.params.user_id || req.params.user_id.length===0) {
      // if no username nor email is passed in, then we have to send this back
      return res.status(400).send()
    }
    /**
     * If the user is not logged in, then we will need to verify they exist
     * We need to make sure they passed in either a username or email address to conduct the search
     * One example why we need this is for the users that have forgotten a password and are not able to log in
     * */
    let query = createQuery(req.params.user_id)
    let user: any
    
    try {
      await User.findOne(query)
      .then((returnedUser)=> {
        user = returnedUser
      })
      .catch((err)=>{
        next(err)
      })
      
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

          return Promise.resolve({
            status: 400,
            body: {
              error: 'NO_LOGIN_CREDENTIALS',
              message: 'user has no username/password, but has at least one oauth account that could be used to log in',
              oauth_types: types
            }
          })
        } else {
          let ERROR = 'account has no credentials or oauth: ' + user._id
          next(ERROR)
        }
      }
      // attach the user to the request so we can use this in the next stage
      req.user = user
      next()
    } catch (err) {
      return next(err)
    }
  }
}
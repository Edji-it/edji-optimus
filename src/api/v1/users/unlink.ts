// library imports
import { Request, Response, NextFunction } from 'express'

// project imports
import { generateLoginObjectForUser } from './../../../middleware/login-controller'

export default async function UnlinkOAuth(req: Request, res: Response, next: NextFunction) {
  const { user } = req
  const { oauth_type, new_password } = req.body
  if (!oauth_type) {
    return res.status(400).send({ error: 'oauth_type is a required query parameter' })
  }

  try {
    if(!user.oauth || (user.oauth ?? []).length === 0) {
      return res.status(400).send({error: 'no oauth accounts listed for user'})
    }

    if(user.oauth.filter(x => x.type === oauth_type).length === 0) {
      return res.status(400).send({error: 'user doesnt have a ' + oauth_type + ' account'})
    }

    let new_oauth = user.oauth.filter(x => x.type !== oauth_type)
    // catch the case where they won't have a password after unlink
    if(new_oauth.length === 0 && !user.password && !new_password) {
      return res.status(400).send({error: 'a password must be sent along with unlink request'})
    }

    user.oauth = new_oauth
    if(!user.password && new_password) {
      user.password = new_password
    }

    await user.edjiSave()
    return res.status(200).send(generateLoginObjectForUser(user))
  } catch (err) {
    return next(err)
  }
}

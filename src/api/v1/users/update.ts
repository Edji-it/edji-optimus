// library imports
import * as express from 'express'

// project imports
import * as User from './../../../models/User'

export function updateUser (req: express.Request, res: express.Response) {
  let user = req.body.user

  user.setChangeEmailToken()
}
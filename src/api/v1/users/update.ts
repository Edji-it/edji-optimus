// library imports
import * as express from 'express'

export function updateUser (req: express.Request, res: express.Response) {
  let user = req.body.user

  user.setChangeEmailToken()
}
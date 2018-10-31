import { Request, Response, NextFunction } from 'express'

export function UseTokenController(req: Request, res: Response, next: NextFunction) {
  // return res.status(200).send({
  //   token_name: req.params.token_name,
  //   unhashed_token: req.params.unhashed_token
  // })
  let { token_name, unhashed_token } = req.params
  let user = req.user

}
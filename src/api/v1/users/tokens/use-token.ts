import { Request, Response } from 'express'

export function UseTokenController(req: Request, res: Response) {
  return res.status(200).send({
    token_name: req.params.token_name,
    unhashed_token: req.params.unhashed_token
  })
}
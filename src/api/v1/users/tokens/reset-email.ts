import { Request, Response, NextFunction } from 'express'

export async function ResetEmailHandler(req: Request, res: Response, next: NextFunction) {
  return res.status(200).send()
}
// library imports
import { Request, Response, NextFunction } from 'express'

// project imports
import Standard from '../../../models/Standard'

// all of the error handling
export async function GetStandards(req: Request, res: Response, next: NextFunction) {
  try {
    let standards = await Standard.find()
    return res.status(200).send({ standards })
  } catch (err) {
    return next(err)
  }
}

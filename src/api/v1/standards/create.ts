// library imports
import { Request, Response, NextFunction } from 'express'

// project imports
import Standard, { iStandard } from '../../../models/Standard'

// all of the error handling 
export async function AddStandard(req: Request, res: Response, next: NextFunction) {
  let new_standard: iStandard = req.body.standard

  try {
    let standard = new Standard(new_standard)
    await standard.edjiSave(false)
    return res.status(200).send({standard: standard})
  } catch (err) {
    return next(err)
  }
}

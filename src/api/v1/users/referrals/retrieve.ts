// library imports
import { Request, Response, NextFunction } from 'express'

// project imports
import { createUniqueReferral } from './_retrieve'
import * as Referral from './../../../../models/Referral'

export async function RetrieveRequestHandler(req: Request, res: Response, next: NextFunction) {
  let user = req.user
  try {
    if (!user.referral_code) {
      let referral: any = await createUniqueReferral()
      user.referral_code = referral.code
      await user.edjiSave()
      return res.status(200).send(referral)
    } else {
      let referral = await Referral.findOne({ code: user.referral_code })
      return res.status(200).send(referral)
    }
  } catch (err) {
    return next(err)
  }
}

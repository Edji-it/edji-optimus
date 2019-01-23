// library imports
import { Request, Response, NextFunction } from 'express'
var mongoose = require("mongoose")

// project imports
import Institution = require('../../../models/Institution')

export async function modifyInstitution(req: Request, res: Response, next: NextFunction) {
  let institution_id = req.params.institution_id
  let updated_institution = req.body.institution
  
  // validation for the passed in institution ID
  if (!mongoose.validateEdjiId(institution_id)) {
    return res.status(404).send()
  }
  
  try {
    let institution: any = await Institution.findByIdAndUpdate(
        institution_id,
      {
        updated_institution
      }, {
        new: true,
        runValidators: true
      }
    )
    // the following return object looks odd, but it is how it should return back to the requester
    return res.status(200).send({ institution: institution })
  } catch (err) {
    return next(err)
  }
}
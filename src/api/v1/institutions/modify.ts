// library imports
import { Request, Response, NextFunction } from 'express'
var mongoose = require("mongoose")
import { pick } from 'underscore'

// project imports
import Institution = require('../../../models/Institution')

export async function modifyInstitution(req: Request, res: Response, next: NextFunction) {
  let institution_id = req.params.institution_id
  let updated_institution = req.body
  
  // validation for the passed in institution ID
  if (!mongoose.validateEdjiId(institution_id)) {
    return res.status(404).send()
  }
  
  try {
    // make sure that properties we allow to update actually get updated
    const propertiesToUpdate: any = pick(updated_institution, SIMPLY_UPDATABLE_PROPERTIES)
    const attemptedUpdateProperties: string[] = Object.keys(propertiesToUpdate)
    if (attemptedUpdateProperties.length === 0) {
      return res.status(400).send({ error: 'no valid update properties in project body' })
    }

    let institution: any = await Institution.findByIdAndUpdate(
      institution_id,
      propertiesToUpdate, 
      {
        new: true,
        runValidators: true
      }
    )
    return res.status(200).send({ institution: institution })
  } catch (err) {
    return next(err)
  }
}

const SIMPLY_UPDATABLE_PROPERTIES: string[] = ['outcomes']
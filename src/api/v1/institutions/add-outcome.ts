// library imports
import { Request, Response, NextFunction } from 'express'
var mongoose = require("mongoose")

// project imports
import Standard, { iStandard } from '../../../models/Standard'
import Institution = require('../../../models/Institution')

export async function AddOutcome(req: Request, res: Response, next: NextFunction) {
  let institution_id = req.params.institution_id
  let new_outcomes: Outcomes[] = req.body.outcomes
  
  // validation for the passed in institution ID
  if (!mongoose.validateEdjiId(institution_id)) {
    return res.status(404).send()
  }

  // validation for the outcomes body
  // might be able to handle it with the interface incoming inspection above... TODO: double check
  
  try {
    let outcomes: any = await Institution.findOneAndUpdate(
      {
        _id: institution_id
      },
      {
        $push: { outcomes: new_outcomes }
      }, {
        new: true,
        fields: { 
          outcomes: 1
        }
      }
    )
    // the following return object looks odd, but it is how it should return back to the requester
    return res.status(200).send({ outcomes: outcomes.outcomes })
  } catch (err) {
    return next(err)
  }
}

interface Outcomes {
  standard: string
  short_name: string
  outcome_statement: string
  rubric: Rubric[]
}

interface Rubric {
  grade: Number
  rubric_statement: string
}
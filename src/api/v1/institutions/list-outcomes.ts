// library imports
import { Request, Response, NextFunction } from 'express'
var mongoose = require('mongoose')

// project imports
import Standard, { iStandard } from '../../../models/Standard'
import Institution = require('../../../models/Institution')

export async function GetOutcomes(req: Request, res: Response, next: NextFunction) {
  let institution_id = req.params.institution_id

  // validation for the passed in institution ID
  if (!mongoose.validateEdjiId(institution_id)) {
    return res.status(404).send()
  }

  try {
    let outcomes: any = await Institution.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(institution_id),
        },
      },
      {
        $unwind: '$outcomes',
      },
      {
        $lookup: {
          from: 'standards',
          localField: 'outcomes.standard',
          foreignField: '_id',
          as: 'standard',
        },
      },
      { $unwind: '$standard' },
      {
        $project: {
          _id: '$outcomes._id',
          short_name: '$outcomes.short_name',
          outcome_statement: '$outcomes.outcome_statement',
          rubric: '$outcomes.rubric',
          standard: {
            identifier: 1,
          },
        },
      },
    ]).exec()
    return res.status(200).send({ outcomes: outcomes })
  } catch (err) {
    return next(err)
  }
}

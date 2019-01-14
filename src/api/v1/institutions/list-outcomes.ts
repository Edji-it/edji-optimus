// library imports
import { Request, Response, NextFunction } from 'express'
import * as mongoose from 'mongoose'

// project imports
import Standard, { iStandard } from '../../../models/Standard'
import Institution = require('../../../models/Institution')

// all of the error handling 
export async function GetOutcomes(req: Request, res: Response, next: NextFunction) {
  let institution_id = req.params.institution_id
  let user = req.user
  
  try {
    let outcomes: any = await Institution.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(institution_id)
        }
      },
      {
        $unwind: "$outcomes"
      },
      {
        $lookup: {
          from: "standards",
          localField: "outcomes.standard",
          foreignField: "_id",
          as: "standard"
        }
      },
      { $unwind: "$standard" },
      {
        $project: {
          short_name: "$outcomes.short_name",
          outcome_statement: "$outcomes.outcome_statement",
          rubric: "$outcomes.rubric",
          standard: {
            identifier: 1
          }
        }
      }
    ]).exec()
    return res.status(200).send({outcomes: outcomes})
  } catch (err) {
    return next(err)
  }
}
// library imports
import { RequestHandler } from 'express'

// project imports
import Institution from '../../../models/Institution'

export const GetAcademiesHandler: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user
    if (!user.institution_ids || user.institution_ids.length < 1) return res.status(200).send({ academies: [] })

    const academies = await Institution.aggregate([
      { $match: { _id: { $in: user.institution_ids } } },
      {
        $lookup: {
          from: 'licenses',
          as: 'licenses',
          let: { institution_id: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$$institution_id', '$owning_institution'] } } },
            { $project: { roles: 1 } },
          ],
        },
      },
      {
        $addFields: {
          roles: {
            $map: {
              input: '$licenses',
              as: 'license',
              in: {
                $reduce: {
                  input: '$$license.roles',
                  initialValue: [],
                  in: {
                    $cond: {
                      if: { $and: [{ $eq: ['$$this.user_id', user._id] }] },
                      then: { $concatArrays: [['$$this.role'], '$$value'] },
                      else: '$$value',
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          roles: {
            $reduce: {
              input: '$roles',
              initialValue: [],
              in: {
                $concatArrays: ['$$value', '$$this'],
              },
            },
          },
        },
      },
      { $project: { license_ids: false, licenses: false } },
    ]).exec()
    return res.status(200).send({ academies })
  } catch (err) {
    return next(err)
  }
}

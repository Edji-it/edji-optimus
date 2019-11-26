import { Request, Response, NextFunction } from 'express'
import Reading from '../../../models/Reading'

const responseShape = {
  title: 1,
  owner_id: 1,
  reading_type: 1,
  institution_id: 1,
  source: 1,
  subjects: 1,
  grade_levels: 1,
  cover_img: 1,
  draft: 1,
  version_id: 1,
  createdAt: 1,
  updatedAt: 1,
  version_count: 1,
  owner_bookmarked: 1,
  default_instructions: 1,
}

const acceptedTypes: string[] = ['draft', 'owner_bookmarked']

export async function TempTypeHandler(req: Request, res: Response, next: NextFunction) {
  let type: string = req.params.temp_type

  if (acceptedTypes.indexOf(type) < 0) {
    return res.status(400).send({ error: 'unacceptable reading type' })
  }

  let user: any = req.user
  let query = {
    owner_id: user._id,
    [type]: true,
  }

  try {
    let pipeline: any[] = [
      {
        $match: query,
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: responseShape,
      },
    ]
    if (req.query.pop && req.query.pop === 'projects') {
      pipeline.push(
        {
          $lookup: {
            from: 'projects',
            localField: '_id',
            foreignField: 'reading_id',
            as: 'projects',
          },
        },
        {
          $addFields: {
            projects: {
              $map: {
                input: '$projects',
                in: {
                  _id: '$$this._id',
                  reading_id: '$$this.reading_id',
                  teacher_id: '$$this.teacher_id',
                  label: '$$this.label',
                  code: '$$this.code',
                  types: '$$this.types',
                  createdAt: '$$this.createdAt',
                  updatedAt: '$$this.updatedAt',
                  students_ids: '$$this.students_ids',
                  comment_count: {
                    $size: '$$this.comments',
                  },
                  student_count: {
                    $sum: [{ $size: '$$this.students_ids' }, { $size: '$$this.temp_ids' }],
                  },
                },
              },
            },
          },
        },
      )
    }
    pipeline.push()
    let readings = await Reading.aggregate(pipeline)
    return res.status(200).send({ readings })
  } catch (err) {
    next(err)
  }
}

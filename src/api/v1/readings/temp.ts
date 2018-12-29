import { Request, Response, NextFunction } from 'express'
import * as Reading from '../../../models/Reading'

export async function TempTypeHandler(req: Request, res: Response, next: NextFunction) {
  let type: string = req.params.temp_type
  const acceptedTypes: string[] = [
    'draft',
    'owner_bookmarked'
  ]

  if (acceptedTypes.indexOf(type) < 0) {
    return res.status(400).send({ error: 'unacceptable reading type' })
  }

  let user: any = req.user
  let query = {
    owner_id: user._id,
    [type]: true
  }

  try {
    let readings = await Reading.find(
      query,
      {
        title: "$reading.title",
        owner_id: "$reading.owner_id",
        teacher_ids: "$reading.teacher_ids",
        "public": "$reading.public",
        source: "$reading.source",
        subjects: "$reading.subjects",
        grade_levels: "$reading.grade_levels",
        cover_img: "$reading.cover_img",
        draft: "$reading.draft",
        version_id: "$reading.version_id",
        createdAt: "$reading.createdAt",
        updatedAt: "$reading.updatedAt",
        version_count: 1,
        owner_bookmarked: 1
      },
      {
        sort: {
          createdAt: -1
        }
      }
    )
    return res.status(200).send({ readings })
  } catch (err) {
    next(err)
  }
}
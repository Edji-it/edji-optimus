import { Request, Response, NextFunction } from 'express'
import * as Reading from './../../../../models/Reading'

export async function ListDraftsHandler(req: Request, res: Response, next: NextFunction) {
  let user: any = req.user

  try {
    let readings = await Reading.find(
      {
        owner_id: user._id,
        draft: true
      },
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
        version_count: 1
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
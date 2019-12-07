// library imports
import { RequestHandler } from 'express'

// project imports
import { EdjiModel, EdjiDocument } from '../models/ModelCreator'

export const simpleUpdate = (
  model: EdjiModel<EdjiDocument>,
  idParam: string,
  updateable?: string[],
): RequestHandler => {
  return async (req, res, next) => {
    try {
      const update = req.body
      const { _id: owner_id } = req.context.user
      const _id = req.params[idParam]
      if (updateable) {
        const invalidKeys = Object.keys(update).filter(key => !updateable.includes(key))
        if (invalidKeys.length > 0)
          return res
            .status(400)
            .send({ error: 'attempted to update properties which are not allowed', keys: invalidKeys })
      }
      const { n: documentsFound } = await model.updateOne(
        { _id, owner_id },
        { $set: { ...update } },
        { runValidators: true },
      )
      switch (documentsFound) {
        case 0:
          res.status(403)
          break
        case 1:
        default:
          res.status(200)
          model.updateIndex(_id)
      }
      return next()
    } catch (err) {
      return next(err)
    }
  }
}

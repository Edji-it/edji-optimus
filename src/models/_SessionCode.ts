// library imports
import { RequestHandler } from 'express'

// project imports
import * as SessionCode from './SessionCode'

export const activateCustomCode = (): RequestHandler => {
  return async (req, res, next) => {
    const { customCode } = req.context
    if (customCode) {
      await SessionCode.updateOne({ code: customCode }, { $set: { active: true } })
    }
    next()
  }
}

import { RequestHandler } from 'express'

export const validateIdParameters = function(...idParams: string[]): RequestHandler {
  return (req, res, next) => {
    for (const prop of idParams) {
      if (!isValidId(req.params[prop])) {
        return res.status(400).send({ error: `route param "${prop}" is not a valid bson id` })
      }
    }
    next()
  }
}

const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$')
export const isValidId = function (id: string) {
  return id && id.length === 24 && checkForHexRegExp.test(id)
}
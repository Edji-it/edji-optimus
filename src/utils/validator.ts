// library imports
import * as Joi from 'joi'
import { RequestHandler } from 'express'
import { BadRequestError } from './../schemas/Error'

/** @todo write tests */

export const withQueryValidator = (schema: Joi.Schema): RequestHandler => {
  return req => {
    try {
      const { error, value } = schema.validate(req.query)
      if (error) throw new BadRequestError(error.details[0].message, 400)
      req.query = value
    } catch (err) {
      throw err
    }
  }
}

export const withBodyValidator = (schema: Joi.Schema): RequestHandler => {
  return req => {
    try {
      const { error, value } = schema.validate(req.body)
      if (error) throw new BadRequestError(error.details[0].message, 400)
      req.body = value
    } catch (err) {
      throw err
    }
  }
}

export { Joi as Validator }

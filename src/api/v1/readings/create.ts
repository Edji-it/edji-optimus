import { RequestHandler } from 'express'

import * as Reading from './../../../models/Reading'
import { assignVersionId, recordUserReferral } from './_create'
import { cleanMongoValidationError } from './../../../error-handlers/mongo-validation'
import { captureException } from '@sentry/node'

const CreateReadingHandler: RequestHandler = async function(req, res, next) {
  let user: any = req.user
  let reading: any = req.body.reading

  if (!reading) {
    return res.status(400).send({ validationErrors: { reading: 'required' } })
  }

  try {
    reading = new Reading(reading) // reassign reading as the mongoose model
    await assignVersionId(reading, user._id)
    await reading.validate()
    reading = await reading.edjiSave()
    try {
      await recordUserReferral(user)
    } catch (err) {
      // this isn't blocking to the reading getting created, but we want to know about it
      captureException(err)
    }
    return res.status(201).send({ reading })
  } catch (err) {
    return next(err)
  }
}

export default CreateReadingHandler

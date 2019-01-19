import { Request, Response, NextFunction } from 'express'
import { ObjectId } from 'mongodb'

import * as Reading from './../../../models/Reading'
import { assignVersionId, recordUserReferral } from './_create'
import { cleanMongoValidationError } from './../../../error-handlers/mongo-validation'
import { captureException } from '@sentry/node'

export async function CreateReadingHandler(req: Request, res: Response, next: NextFunction) {
  let user: any = req.user
  let reading: any = req.body.reading

  if (!reading) {
    return res.status(400).send({ validationErrors: { reading: "required" } })
  }

  // We need to assign an object ID to the reading since this is the first time a reading 
  // document will be created and ReadingVersion needs to know this to populate in to the readings array
  reading._id = new ObjectId()

  try {
    await assignVersionId(reading, user._id)
  } catch (err) {
    // this could produce a 500 if we do it wrong
    return next(err)
  }

  reading = new Reading(reading) // reassign reading as the mongoose model

  try {
    await reading.validate()
  } catch (err) {
    let validationErrors = cleanMongoValidationError(err)
    return res.status(406).send({ validationErrors })
  }

  try {
    await reading.edjiSave({ forceSave: true })
  } catch (err) {
    return next(err)
  }

  try {
    await recordUserReferral(user)
  } catch (err) {
    captureException(err)
  }
  return res.status(201).send({ reading })
}
import { RequestHandler } from 'express'

import Reading from './../../../models/Reading'
import { assignVersionId, recordUserReferral } from './_create'
import { captureException } from '@sentry/node'

const CreateReadingHandler: RequestHandler = async function(req, res, next) {
  const user: any = req.user
  const doc: any = req.body.reading

  if (!doc) {
    return res.status(400).send({ validationErrors: { reading: 'required' } })
  }

  try {
    const reading = new Reading(doc) // reassign reading as the mongoose model
    await assignVersionId(reading, user._id)
    await reading.validate()
    await reading.edjiSave()
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

// library imports
import { Request, Response, NextFunction } from 'express'
let mongoose = require("mongoose")
import { pick } from 'underscore'

// project imports
import Institution = require('../../../models/Institution')
import { cleanMongoValidationError } from '../../../error-handlers/mongo-validation'

export async function UpdateInstitution(req: Request, res: Response, next: NextFunction) {
  try {
    const { institution_id } = req.params
    let updated_institution: any = req.body

    if (!mongoose.validateEdjiId(institution_id)) {
      return res.status(400).send({ error: 'invalid institution id passed' })
    }

    // make sure that properties we allow to update actually get updated
    const propertiesToUpdate: any = pick(updated_institution, SIMPLY_UPDATABLE_PROPERTIES)
    const attemptedUpdateProperties: string[] = Object.keys(propertiesToUpdate)
    if (attemptedUpdateProperties.length === 0) {
      return res.status(400).send({ error: 'no valid update properties in project body' })
    }

    let institution: any = await Institution.findByIdAndUpdate(
      institution_id,
      propertiesToUpdate, 
      {
        new: true,
        runValidators: true
      }
    )
    const updated = pick(institution, attemptedUpdateProperties)
    return res.status(200).send(updated)
  } catch (err) {
    if (err.name === "ValidationError") {
      let validationErrors = cleanMongoValidationError(err)
      return res.status(406).send({ validationErrors })
    }
    return next(err)
  }
}

export async function UpdateInstitutionProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const { institution_id, update_property } = req.params
    let update: any = req.body

    if (!mongoose.validateEdjiId(institution_id)) {
      return res.status(400).send({ error: 'invalid institution id passed' })
    }

    if (!CUSTOM_UPDATABLE_PROPERTIES.includes(update_property)) {
      return res.status(400).send({ error: 'requested update of a property which could not be updated' })
    }

    const updateObj = await UPDATE_CONTROLLERS[update_property]({ institution_id, update })
    return res.status(200).send(updateObj)
  } catch (err) {
    if (err.name === 'ValidationError') {
      let validationErrors = cleanMongoValidationError(err)
      return res.status(406).send({ validationErrors })
    }
    return next(err)
  }
}

const UPDATE_CONTROLLERS: {
  [key: string]: (props: { institution_id: string, update: any }) => Promise<any>
} = {
  outcomes: function (props) {
    return updateOutcomeArray(props)
  }
}

const updateOutcomeArray = async ({ institution_id, update }) => {
  // if the outcome passed in has an _id on it, then we need to update this outcome
  const outcome_id = update._id
  if (outcome_id) {
    const outcomeUpdate = {
      $set: {
        "outcomes.$": update
      }
    }
    let institution: any = await Institution.findOneAndUpdate(
      {_id: institution_id, "outcomes._id": outcome_id},
      outcomeUpdate, 
      {
        new: true,
        runValidators: true
      }
    )
    return update
  } else {
    // if the outcome(s) passed in does not have an _id on it, then we need to add it to the array
    let institution: any = await Institution.findByIdAndUpdate(
      institution_id,
      { $push: { outcomes: update } }, 
      {
        new: true,
        runValidators: true
      }
    )
    return update
  }
}

const SIMPLY_UPDATABLE_PROPERTIES: string[] = ['name', 'abbreviation']
const CUSTOM_UPDATABLE_PROPERTIES: string[] = Object.keys(UPDATE_CONTROLLERS)
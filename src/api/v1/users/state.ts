// library imports
import { RequestHandler } from 'express'
import * as joi from 'joi'

// project imports
import { UserState } from './../../../models/State'

export const PostStateHandler: RequestHandler = async (req, res, next) => {
  const { key } = req.params
  const link = req.user._id
  const value = req.body
  try {
    if (req.user.type === 'temp') {
      return res.status(201).send()
    }
    await UserState.findOneAndUpdate({ key, link }, { $set: { value } }, { upsert: true })
    return res.status(201).send()
  } catch (err) {
    return next(err)
  }
}

export const GetStateHandler: RequestHandler = async (req, res, next) => {
  const { key } = req.params
  const link = req.user._id
  try {
    const state = await UserState.findOne({ key, link })
    return res.status(200).send((state && state.value) || {})
  } catch (err) {
    return next(err)
  }
}

export const GetStatesHandler: RequestHandler = async (req, res, next) => {
  const link = req.user._id
  const { keys } = req.query
  if (!keys) return res.status(400).send({ error: 'keys query parameter required' })
  try {
    const states = await UserState.find({
      link,
      key: {
        $in: keys,
      },
    })
      .lean()
      .exec()
    let combinedStates = {}
    for (let state of states) {
      combinedStates[state.key] = state.value
    }
    return res.status(200).send(combinedStates)
  } catch (err) {
    return next(err)
  }
}

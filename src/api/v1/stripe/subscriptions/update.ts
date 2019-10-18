// library imports
import { RequestHandler } from 'express'

// project imports
import { rejoinSubscription } from './../_stripe'

const UpdateSubscription: RequestHandler = async (req, res, next) => {
  let user = req.user
  const subscription_id = req.params.subscription_id

  if (!subscription_id) {
    return res.status(400).send({ error: 'invalid parameters: missing subscription_id' })
  }

  try {
    await rejoinSubscription(subscription_id)
    return res.status(200).send({ user })
  } catch (err) {
    return next(err)
  }
}

export default UpdateSubscription

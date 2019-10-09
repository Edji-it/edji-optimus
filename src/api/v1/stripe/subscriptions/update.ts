// library imports
import { RequestHandler } from 'express'

// project imports
import { api as stripe } from './../_stripe'

const UpdateSubscription: RequestHandler = async (req, res, next) => {
  let user = req.user
  const subscription_id = req.params.subscription_id

  if (!subscription_id) {
    return res.status(400).send({ error: 'invalid parameters: missing subscription_id' })
  }

  try {
    const subscription = await stripe.subscriptions.update(subscription_id, { cancel_at_period_end: false })
    return res.status(200).send({ user: user, subscription: subscription })
  } catch (err) {
    return next(err)
  }
}

export default UpdateSubscription

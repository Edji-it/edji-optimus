// library imports
const sentry = require('@sentry/node')

// project imports
const stripe = require('./../_stripe').api

module.exports = async function (req, res, next) {
  let user = req.user
  const subscription_id = req.params.subscription_id

  // send an update to stripe to make sure we remove the cancellation
  try {
    let subscription = await stripe.subscriptions.update(subscription_id, { cancel_at_period_end: false })
    if (subscription) {
      return res.status(200).send({ user: user, subscription: subscription })
    } else {
      return res.status(404).send({ error: 'no subscription found' })
    }
  } catch (err) {
    return next(err)
  }
}
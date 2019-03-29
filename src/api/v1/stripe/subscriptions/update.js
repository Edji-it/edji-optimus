// library imports
const sentry = require('@sentry/node')

// project imports
const stripe = require('./../_stripe').api
const helpers = require('./../_stripe')
const Sentry = require('@sentry/node')

module.exports = function (req, res, next) {
  let user = req.user
  const subscription_id = req.params.subscription_id

  // send back an error if this endpoint is being called without a subscription_id
  if (!subscription_id) {
    return res.status(400).send({ error: 'invalid parameters: missing subscription_id' })
  }

  // send an update to stripe to make sure we remove the cancellation
  stripe.subscriptions.updateOne(subscription_id, { cancel_at_period_end: false })
  .then((subscription) => {
    return res.status(200).send({user: user, subscription: subscription})
  })
  .catch((err) => {
    next(err)
  })
}
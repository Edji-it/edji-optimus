// library imports
const sentry = require('@sentry/node')

// project imports
const stripe = require('./../_stripe').api
const _stripe = requite('./../_stripe')

module.exports = function (req, res, next) {
  let user = req.user
  // the stripe_cust_id is a param that is the user's Stripe customer ID
  const customer_id = req.user.stripe_customer_id
  if (!customer_id) {
    return res.status(400).send({ error: 'invalid parameters: missing customer_id' })
  }

  _stripe.getHeroSubscriptions(customer_id, 'active')
    .then((subscriptions) => {
      // if there are no subscriptions for that customer, then we don't need to do anything (it is very suspicious if this call is made though)
      if (subscriptions.length < 1) {
        return res.status(304).send()
      }

      // make sure we only have 1 subscription, otherwise we'll need to throw an error and correct the issue
      if (subscriptions.length===1) {
        subscription = subscriptions[0]
      } else if (subscriptions.length>1) {
        sentry.captureException(new Error('more than one Hero subscription in stripe'))
        return res.status(500).send()
      }

      // send an update to stripe to make sure we remove the cancellation
      stripe.subscriptions.update(subscription.id, { cancel_at_period_end: false }).then((subscription) => {
        return res.status(200).send({subscription: subscription})
      })
    })
}
// library imports
const Q = require('q')

// project imports
const helpers = require('./_create')
const stripe = require('./../_stripe')

module.exports = function(req, res) {
  let user = req.user
  const body = helpers.validateBody(req.body)
  if (body.error) {
    return res.status(400).send({ error: body.error })
  }

  stripe.retrieveOrCreateCustomer(req.user, body.value.paymentToken)
  .then((customer) => {
    return stripe.api.subscriptions.create({
      customer: customer.id,
      coupon: body.value.couponCode,
      source: body.value.paymentToken
    })
  })
  .then((subscription) => {
    return res.status(200).send({ subscription: subscription })
  })
  .catch((err) => {
    return res.status(500).send()
  })

  // get the stripe customer
  // are they subscribed?
    // yes: return error?
    // no: subscribe them
  // update user object with subscription & other Hero info (simplified)
}
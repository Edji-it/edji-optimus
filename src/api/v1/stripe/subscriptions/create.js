// library imports
const Q = require('q')

// project imports
const helpers = require('./_create')
const stripe = require('./../_stripe')

module.exports = function (req, res, next) {
  let user = req.user
  const body = helpers.validateBody(req.body)
  if (body.error) {
    return res.status(400).send({ error: body.error })
  }

  stripe.retrieveOrCreateCustomer(req.user, body.value.token)
    .then((customer) => {
      return stripe.api.subscriptions.create({
        customer: customer.id,
        coupon: body.value.couponCode,
        plan: 'yearly'
      })
    })
    .then((subscription) => {
      user.stripe_customer_id = subscription.customer
      user.hero_status = true

      return user.edjiSave(false)
        .then((result) => {
          return res.status(200).send({ subscription: subscription, user: result.toPublic() })
        })
    })
    .catch((err) => {
      next(err)
    })
}
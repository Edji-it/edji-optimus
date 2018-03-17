// library imports
const Q = require('q')

// project imports
const helpers = require('./_create')
const stripe = require('./_stripe')

module.exports = function(req, res) {
  let user = req.user
  const body = helpers.validateBody(req.body)
  if (body.error) {
    return res.status(400).send({ error: body.error })
  }

  // helpers.retrieveOrCreateCustomer(req.user)
  // .then((customer) => {
  //   return res.status(200).send({ customer: customer })
  // })
  // .catch((err) => {
  //   console.error(err)
  //   return res.status(500).send()
  // })

  // stripe.api.customers.retrieve(req.user.hero.customer_id)
  stripe.retrieveOrCreateCustomer(req.user, body.value.paymentToken)
  .then((customer) => {
    return res.status(200).send({ customer: customer })
  })
  .catch((err) => {
    return res.status(500).send()
  })
}
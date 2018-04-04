// library imports
const stripe = require('./../_stripe').api

module.exports = function(req, res) {
  let customer_id = req.params.id
  let user = req.user

  if (!user.stripe_customer_id) { return res.status(400).send({ error: 'user is not a stripe customer' }) }
  if (!customer_id) { return res.status(400).send({ error: 'invalid parameters: missing customer_id' }) }

  if (customer_id != user.stripe_customer_id) { return res.status(401).send() }

  stripe.customers.retrieve(customer_id)
  .then((customer) => {
    return res.status(200).send({ customer: customer })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}
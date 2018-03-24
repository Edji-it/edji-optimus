// library imports
const stripe = require('./../_stripe').api

module.exports = function(req, res) {
  let customer_id = req.params.id
  let user = req.user
  if (!user.hero || !customer_id) { return res.status(400).send({ error: 'invalid parameters' }) }

  if (!user.hero.customer_id == customer_id) { return res.status(401).send() }

  stripe.customers.retrieve(customer_id)
  .then((customer) => {
    return res.status(200).send({ customer: customer })
  })
  .catch((err) => {
    console.error(err)
    return res.status(500).send()
  })
}
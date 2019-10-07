// library imports
import { RequestHandler } from 'express'
const stripe = require('./../_stripe').api

const RetrieveCustomerHandler: RequestHandler = async (req, res, next) => {
  const customer_id = req.params.stripe_id
  const user = req.user

  if (!user.stripe_customer_id) {
    return res.status(400).send({ error: 'user is not a stripe customer' })
  }
  if (!customer_id) {
    return res.status(400).send({ error: 'invalid parameters: missing customer_id' })
  }
  if (customer_id != user.stripe_customer_id) {
    return res.status(401).send()
  }

  try {
    const customer = await stripe.customers.retrieve(customer_id)
    // the sources property of the customer object contains sensitive payment information
    // we'll remove this because there is no reason to expose this information outside of the Stripe dashboard
    delete customer.sources
    return res.status(200).send({ customer })
  } catch (err) {
    return next(err)
  }
}

export default RetrieveCustomerHandler

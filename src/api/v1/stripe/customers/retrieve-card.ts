// library imports
import { RequestHandler } from 'express'
import { stripe } from './../_stripe'

const RetrieveCardHandler: RequestHandler = async (req, res, next) => {
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
    const card = await stripe.customers.retrieveSource(customer_id, customer.default_source)
    return res.status(200).send({ card })
  } catch (err) {
    return next(err)
  }
}

export default RetrieveCardHandler

// library imports
import { RequestHandler } from 'express'
import { retrieveCustomer } from './../_stripe'

const RetrieveCustomerHandler: RequestHandler = async (req, res, next) => {
  const customer_id = req.params.stripe_id
  const user = req.user

  if (!user.stripe_customer_id) {
    return res.status(400).send({ error: 'user is not a stripe customer' })
  }
  if (customer_id != user.stripe_customer_id) {
    return res.status(401).send()
  }

  try {
    const customer = await retrieveCustomer(customer_id)
    return res.status(200).send({ customer })
  } catch (err) {
    return next(err)
  }
}

export default RetrieveCustomerHandler

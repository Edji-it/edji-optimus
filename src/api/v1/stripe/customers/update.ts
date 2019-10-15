// library imports
import { RequestHandler } from 'express'
import { updateCustomerCard } from './../_stripe'

// project imports
import { validateBody } from './_update'

const UpdatePaymentMethod: RequestHandler = async (req, res, next) => {
  const customer_id = req.params.stripe_id
  const { error, value } = validateBody(req.body)
  if (error) {
    return res.status(400).send({ error: error })
  }
  const user = req.user

  if (!user.stripe_customer_id) {
    return res.status(400).send({ error: 'user is not a stripe customer' })
  }
  if (!customer_id || customer_id.length < 2) {
    return res.status(400).send({ error: 'invalid parameters: missing customer_id' })
  }
  if (customer_id != user.stripe_customer_id) {
    return res.status(401).send()
  }

  try {
    const updatedCard = await updateCustomerCard(customer_id, value.token)
    return res.status(200).send({ updatedCard })
  } catch (err) {
    return next(err)
  }
}

export default UpdatePaymentMethod

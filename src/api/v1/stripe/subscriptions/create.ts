// library imports
import { RequestHandler } from 'express'

// project imports
import { validateBody } from './_create'
import { retrieveOrCreateCustomer, createStripeSubscription } from './../_stripe'

const CreateSubscription: RequestHandler = async (req, res, next) => {
  const user = req.user
  const { error, value } = validateBody(req.body)
  if (error) {
    return res.status(400).send({ error: error })
  }

  try {
    const customer = await retrieveOrCreateCustomer(req.user, value.token)
    const subscription = await createStripeSubscription(customer.id, value.couponCode)
    // set customer id and hero_status updates on user object
    user.stripe_customer_id = subscription.customer
    user.hero_status = true

    const updatedUser = await user.edjiSave()
    return res.status(200).send({ subscription: subscription, user: updatedUser.toPublic() })
  } catch (err) {
    return next(err)
  }
}

export default CreateSubscription

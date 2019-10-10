// library imports
import { RequestHandler } from 'express'

// project imports
import validateBody from './_create'
import { stripe } from './../_stripe'

const CreateSubscription: RequestHandler = async (req, res, next) => {
  const user = req.user
  const body = validateBody(req.body)
  if (body.error) {
    return res.status(400).send({ error: body.error })
  }

  try {
    const customer = await stripe.retrieveOrCreateCustomer(req.user, body.value.token)
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      coupon: body.value.couponCode,
      plan: 'yearly',
    })
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

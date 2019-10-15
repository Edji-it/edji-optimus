// library imports
import { RequestHandler } from 'express'

// project imports
import { stripe } from './../_stripe'
import { getHeroSubscriptions } from './../_stripe'

// module.exports = function(req, res, next) {
const DeleteSubscription: RequestHandler = async (req, res, next) => {
  const user = req.user

  if (!user.stripe_customer_id) {
    return res.status(400).send({ error: 'user is not a stripe customer' })
  }
  const customer_id = user.stripe_customer_id

  /**
   * Using the Stripe API, delete the current billing for the customer ID from Stripe to cancel any future billing
   *
   * However, the customer_id will not be removed from the current user object, and their hero_status will remain
   * active until the would-be next billing
   */
  try {
    // first we need to get the subscription for the customer_id
    const subscriptions = await getHeroSubscriptions(customer_id, 'active')
    // if there are no subscriptions for that customer, then we don't need to do anything (it is very suspicious if this call is made though)
    if (subscriptions.length < 1) {
      return res.status(400).send()
    }
    const promises = subscriptions.map(sub => {
      stripe.subscriptions.update(sub.id, { cancel_at_period_end: true })
    })
    await Promise.all(promises)
    return res.status(200).send({ canceled: true })
  } catch (err) {
    return next(err)
  }
}

export default DeleteSubscription

// library imports
const Q = require('q')

// project imports
const stripe = require('./../_stripe').api
const helper = require('./../_stripe')

module.exports = function (req, res, next) {
  let user = req.user
  let subscription = ''

  // the stripe_cust_id is a param that is the user's Stripe customer ID
  const customer_id = req.params.stripe_cust_id
  if (!customer_id) { 
    return res.status(400).send({ error: 'invalid parameters: missing customer_id' }) 
  }

  /**
   * Using the Stripe API, delete the current billing for the customer ID from Stripe to cancel any future billing
   * 
   * However, the customer_id will not be removed from the current user object, and their hero_status will remain 
   * active until the would-be next billing
   */
  // first we need to get the subscription for the customer_id
  helper.getHeroSubscription(customer_id)
  .then((subscription) => {
    // if the subscription is still under the customer and not active, then they are already cancelled
    if (!subscription.plan.active) {
      return res.status(200).send({ user: user.toPublic() })
    }
    // once we get the subscription_id we can cancel it
    stripe.subscriptions.del(subscription.id)
    .then((cancelled) => {
      let cancelDate = new Date()
      user['hero_cancelled'] = cancelDate
      user['hero_expiration'] = helper.getStripeDate(subscription.current_period_end)
      user.edjiSave(false).then((updatedUser) => {
        // make sure the correct hero cancellation date was added to the user object
        if (updatedUser.hero_cancelled.toString()===cancelDate.toString()) {
          // send the updated user object back if the user is successfully updated
          return res.status(200).send({ user: updatedUser.toPublic() })
        } else {
          // sends our rejection to the catch
          return Q.reject("user not updated with cancellation date")
        }
      })
    })
  })
  .catch((err) => {
    next(err)
  })
}
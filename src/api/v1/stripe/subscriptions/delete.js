// library imports
const STRIPE_KEY = process.env.STRIPE_API_TOKEN
const stripe = require('stripe')(STRIPE_KEY)

// project imports
const User = require('./../../../../models/User')

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
  stripe.customers.retrieve(customer_id)
  .then((customer) => {
    let len = customer.subscriptions.data.length
    subscription = customer.subscriptions.data[len-1]
    if (!subscription.plan.active) {
      return res.status(200).send({ user: user.toPublic() })
    }
    // once we get the subscription_id we can cancel it
    stripe.subscriptions.del(subscription.id)
    .then((cancelled) => {
      // then we update the user to show when the cancelled their subscription for display and tracking purposes
      return User.findByIdAndUpdate(
        user._id,
        {
          hero_cancelled: new Date()
        },
        {
          new: true
        }
      )
    })
    .then((updatedUser) => {
      // send the new license object back after updating the institution to include the new license_id
      return res.status(200).send({ user: updatedUser.toPublic() })
    })
  })
  .catch((err) => {
    next(err)
  })
}
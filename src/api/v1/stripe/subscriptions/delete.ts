// library imports
import { RequestHandler } from 'express'
const Q = require('q')

// project imports
const stripe = require('./../_stripe').api
const helper = require('./../_stripe')

// module.exports = function(req, res, next) {
const DeleteSubscription: RequestHandler = async (req, res, next) => {
  let user = req.user

  // the stripe_cust_id is a param that is the user's Stripe customer ID
  const customer_id = req.user.stripe_customer_id
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
  helper
    .getHeroSubscriptions(customer_id, 'active')
    .then(subscriptions => {
      // if there are no subscriptions for that customer, then we don't need to do anything (it is very suspicious if this call is made though)
      if (subscriptions.length < 1) {
        return res.status(304).send()
      }
      let promises = []
      // once we get the subscription_id we can cancel it - if there are multiple, cancel them all
      subscriptions.forEach(subscription => {
        promises.push(stripe.subscriptions.updateOne(subscription.id, { cancel_at_period_end: true }))
      })
      return Promise.all(promises)
    })
    .then(canceled => {
      return res.status(200).send({ canceled })
    })
    .catch(err => {
      next(err)
    })
}

export default DeleteSubscription

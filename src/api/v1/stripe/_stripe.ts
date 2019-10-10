const STRIPE_KEY = process.env.STRIPE_API_TOKEN
export const stripe = require('stripe')(STRIPE_KEY)
import * as sentry from '@sentry/node'

/**
 * Takes a user object and returns the Stripe customer in a promise
 * @param {Object} user the user attached to the request body by auth middleware
 * @param {string} paymentToken [optional] the payment token which may or may not be submitted with Stripe
 */
export const retrieveOrCreateCustomer = async function(user, paymentToken) {
  // get the user if they've already got a customer_id
  if (user && user.stripe_customer_id) {
    return await stripe.customers.retrieve(user.stripe_customer_id)
  } else if (user && user.email) {
    let customer = {
      email: user.email,
      source: paymentToken,
    }

    return await stripe.customers.create(customer)
  } else {
    return Promise.reject({ error: 'user object missing required properties for customer creation' })
  }
}

export const getHeroSubscriptions = async function(customerId, status) {
  const plan = 'yearly'
  if (!status) {
    status = 'active'
  }
  try {
    let subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      plan: plan,
      status: status,
    })

    // this tests if there is at least one subscription for this customer, but will return all subscriptions
    if (subscriptions.data && subscriptions.data.length === 1) {
      return subscriptions.data
    } else if (subscriptions.data && subscriptions.data.length > 1) {
      sentry.captureException(new Error('more than one Hero subscription in stripe'))
      return subscriptions.data
    } else {
      return []
    }
  } catch (err) {
    throw new Error(err)
  }
}

export const getStripeDate = function(utcSeconds) {
  // Stripe sends the date back as the UTC Epoch, so we'll convert it here
  let date = new Date(0)
  date.setUTCSeconds(utcSeconds)
  return date.toDateString()
}

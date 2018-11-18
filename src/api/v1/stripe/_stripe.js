const STRIPE_KEY = process.env.STRIPE_API_TOKEN
const stripe = require('stripe')(STRIPE_KEY) // this will crash without an API key
const sentry = require('@sentry/node')

/**
 * Takes a user object and returns the Stripe customer in a promise
 * @param {Object} user the user attached to the request body by auth middleware
 * @param {string} paymentToken [optional] the payment token which may or may not be submitted with Stripe
 */
const retrieveOrCreateCustomer = function (user, paymentToken) {
  // get the user if they've already got a customer_id
  if (user && user.stripe_customer_id) {
    return stripe.customers.retrieve(user.stripe_customer_id)
  } else if (user && user.email) {
    let customer = {
      email: user.email,
      source: paymentToken
    }

    return stripe.customers.create(customer)
  } else {
    return Promise.reject({ error: 'user object missing required properties for customer creation' })
  }
}

const getHeroSubscriptions = async function (customerId) {
  const plan = 'yearly'
  try {
    let subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      plan: plan
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

const getStripeDate = function (utcSeconds) {
  // Stripe sends the date back as the UTC Epoch, so we'll convert it here
  let date = new Date(0)
  date.setUTCSeconds(utcSeconds)
  return date.toDateString()
}

module.exports = {
  api: stripe,
  retrieveOrCreateCustomer,
  getHeroSubscriptions,
  getStripeDate
}
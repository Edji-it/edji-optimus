const STRIPE_KEY = process.env.STRIPE_API_TOKEN
const stripe = require('stripe')(STRIPE_KEY) // this will crash without an API key
const joi = require('joi')

/**
 * Takes a user object and returns the Stripe customer in a promise
 * @param {Object} user the user attached to the request body by auth middleware
 * @param {string} paymentToken [optional] the payment token which may or may not be submitted with Stripe
 */
const retrieveOrCreateCustomer = function(user, paymentToken) {
  if (user && user.hero && user.hero.customer_id) {
    return stripe.customers.retrieve(user.hero.customer_id)
  } else if(user && user.email) {
    let customer = {
      email: user.email,
      source: paymentToken
    }

    return stripe.customers.create(customer)
  } else {
    return Promise.reject({ error: 'no email on user object' })
  }
}

module.exports = {
  api: stripe,
  retrieveOrCreateCustomer: retrieveOrCreateCustomer
}
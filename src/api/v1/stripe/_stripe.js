const STRIPE_KEY = process.env.STRIPE_API_TOKEN
const stripe = require('stripe')(STRIPE_KEY) // this will crash without an API key
const joi = require('joi')

/**
 * Takes a user object and returns the Stripe customer in a promise
 * @param {Object} user the user attached to the request body by auth middleware
 * @param {string} paymentToken [optional] the payment token which may or may not be submitted with Stripe
 */
const retrieveOrCreateCustomer = function(user, paymentToken) {
  // get the user if they've already got a customer_id
  if (user && user.hero && user.hero.customer_id) {
    return stripe.customers.retrieve(user.hero.customer_id)
  } else if(user && user.email) {
    let customer = {
      email: user.email,
      source: paymentToken
    }

    return stripe.customers.create(customer)
  } else {
    return Promise.reject({ error: 'user object missing required properties for customer creation' })
  }
}

/**
 * Returns a promise resolved with a boolean indicating whether or not 
 * @param {User} user the user for which we should calculate the hero status
 */
const calculateUserHeroStatus = function(user) {
  return new Promise((resolve, reject) => {
    // if a user has a license_id, we'll assume that they're all set
    if (user.license_id) {
      return resolve(true)
    } else if (!user.stripe_customer_id) {
      return resolve(false)
    }

    stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      plan: 'yearly',
      status: 'active'
    })
    .then((subscriptions) => {
      // data is where the list of subscriptions comes back - our query should leave us with only active yearly Hero subs
      //  so if the length is greater than 1, we should be all good for whether the user is a Hero or not
      if (subscriptions && subscriptions.data && subscriptions.data.length > 0) {
        return resolve(true)
      } else {
        return resolve(false)
      }
    })
    .catch((err) => {
      return reject(err)
    })
  })

}

module.exports = {
  api: stripe,
  retrieveOrCreateCustomer: retrieveOrCreateCustomer,
  calculateUserHeroStatus: calculateUserHeroStatus
}
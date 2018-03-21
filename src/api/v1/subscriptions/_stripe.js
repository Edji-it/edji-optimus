const STRIPE_KEY = process.env.STRIPE_API_TOKEN
const stripe = require('stripe')(STRIPE_KEY) // this will crash without an API key
const joi = require('joi')

// /**
//  * Creates and resolves with a new Stripe customer
//  * @param {string} email the user's email
//  * @param {string} paymentToken the payment token provided by Stripe's front end
//  */
// const createCustomer = function(email, paymentToken) {
//   let customer = {
//     email: email
//   }
//   // we may not need this check
//   // if (paymentToken) {
//     customer.source = paymentToken
//   // }

//   return _stripe.api.stripe.customers.create(customer)
// }

/**
 * Takes a user object and returns the Stripe customer in a promise
 * @param {Object} user the user attached to the request body by auth middleware
 * @param {string} paymentToken [optional] the payment token which may or may not be submitted with Stripe
 */
const retrieveOrCreateCustomer = function(user, paymentToken) {
  // if (validateUser(user).error) {
  //   return Promise.reject({ error: 'invalid user object pass to retrieveOrCreateCustomer' })
  // }

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

// const validateUser = function(user) {
//   let userSchema = joi.object({
//     hero: joi.object({
//       customer_id: joi.string()
//     }),
//     email: joi.string()
//   })

//   return joi.validate(user)
// }

module.exports = {
  api: stripe,
  retrieveOrCreateCustomer: retrieveOrCreateCustomer
}
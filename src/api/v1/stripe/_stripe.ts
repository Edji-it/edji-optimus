const STRIPE_KEY = process.env.STRIPE_API_TOKEN
export const stripe = require('stripe')(STRIPE_KEY)
import * as sentry from '@sentry/node'

/**
 * Takes a user object and returns the Stripe customer in a promise
 * @param {Object} user the user attached to the request body by auth middleware
 * @param {string} paymentToken [optional] the payment token which may or may not be submitted with Stripe
 */
export const retrieveOrCreateCustomer = async (user: any, paymentToken: string) => {
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

export const getHeroSubscriptions = async (customerId: string, status: string) => {
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

export const retrieveCustomerCard = async (customer_id: string) => {
  try {
    const customer = await stripe.customers.retrieve(customer_id)
    const card = await stripe.customers.retrieveSource(customer_id, customer.default_source)
    return card
  } catch (err) {
    return err
  }
}

export const retrieveCustomer = async (customer_id: string) => {
  try {
    const customer = await stripe.customers.retrieve(customer_id)
    // the sources property of the customer object contains sensitive payment information
    // we'll remove this because there is no reason to expose this information outside of the Stripe dashboard
    delete customer.sources
    return customer
  } catch (err) {
    return err
  }
}

export const updateCustomerCard = async (customer_id: string, token: string) => {
  try {
    const updatedCard = await stripe.customers.update(customer_id, {
      source: token,
    })
    return updatedCard
  } catch (err) {
    return err
  }
}

export const getStripeDate = (utcSeconds: any) => {
  // Stripe sends the date back as the UTC Epoch, so we'll convert it here
  let date = new Date(0)
  date.setUTCSeconds(utcSeconds)
  return date.toDateString()
}

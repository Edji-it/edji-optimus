const STRIPE_KEY = process.env.STRIPE_API_TOKEN
export const stripe = require('stripe')(STRIPE_KEY)
import * as sentry from '@sentry/node'

// API reference export (don't use this directly in API calls, used for testing only)
export const api = stripe

// Edji Stripe defaults
const plan = 'yearly'

/**
 * Takes a user object and returns the Stripe customer in a promise
 * @param {Object} user the user attached to the request body by auth middleware
 * @param {string} paymentToken [optional] the payment token which may or may not be submitted with Stripe
 */
export const retrieveOrCreateCustomer = async (user: any, paymentToken: string) => {
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

/**
 * Gets a listing of all Stripe subscriptions based on the status that we are looking for
 * @param customerId the Stripe customer id that we attach to the user
 * @param status the status we are looking for on subscriptions in Stripe
 */
export const getHeroSubscriptions = async (customerId: string, status: string) => {
  if (!status) {
    status = 'active'
  }
  try {
    let subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      plan: plan,
      status: status,
    })

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

/**
 * Retrieves the payment source information for a customer in Stripe
 * @param customer_id the Stripe customer id that we attach to the user
 */
export const retrieveCustomerCard = async (customer_id: string) => {
  try {
    const customer = await stripe.customers.retrieve(customer_id)
    const card = await stripe.customers.retrieveSource(customer_id, customer.default_source)
    return card
  } catch (err) {
    return err
  }
}

/**
 * Gets the customer information from Stripe based on the customer id as saved to the user object
 * removes the sources information (payment)
 * @param customer_id the Stripe customer id that we attach to the user
 */
export const retrieveCustomer = async (customer_id: string) => {
  try {
    const customer = await stripe.customers.retrieve(customer_id)
    delete customer.sources
    return customer
  } catch (err) {
    return err
  }
}

/**
 * Updates the payment source token on the customer object in Stripe after the cc info is passed directly to Stripe via the front end
 * @param customer_id the Stripe customer id that we attach to the user
 * @param token is the new payment source token
 */
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

/**
 * Creates a new subscription to the product sold in Stripe that charges a customer (or applies a coupon for reduced/free amount)
 * @param customer_id the Stripe customer id that we attach to the user
 * @param couponCode optional parameter that we would pass through if there is a coupon for the purchase
 */
export const createStripeSubscription = async (customer_id: string, couponCode?: string) => {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customer_id,
      coupon: couponCode,
      plan: plan,
    })
    return subscription
  } catch (err) {
    return err
  }
}

/**
 * Cancels all subscriptions for the customer in Stripe
 * @param subscriptions are the subscriptions from Stripe that a customer will have
 */
export const cancelSubscriptions = async (subscriptions: any) => {
  try {
    const promises = subscriptions.map(sub => {
      stripe.subscriptions.update(sub.id, { cancel_at_period_end: true })
    })
    await Promise.all(promises)
  } catch (err) {
    return err
  }
}

/**
 * Reactivates a subscription that was cancelled if reactivating before it fully cancels at the end of the paid period
 * @param subscription_id is the subscription id for the paid subscription the user will be reactivating
 */
export const rejoinSubscription = async (subscription_id: string) => {
  try {
    const subscription = await stripe.subscriptions.update(subscription_id, { cancel_at_period_end: false })
    return subscription
  } catch (err) {
    return err
  }
}

/**
 * Converts the date from the UTC Epoch as Stripe saves it to a more readable format we can use
 * @param utcSeconds Stripe UTC Epoch date
 */
export const getStripeDate = (utcSeconds: any) => {
  return new Date().setUTCSeconds(utcSeconds)
}

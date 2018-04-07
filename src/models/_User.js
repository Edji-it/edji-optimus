// project imports
const stripe = require('./../api/v1/stripe/_stripe').api

// constants
const MESSAGE_CHECK_INTERVAL = 1000 * 60 * 1 // 1 minute
const USER_REFRESH_INTERVAL = 1000 * 60 * 60 * 12 // 12 hrs

/**
 * Returns a promise resolved with a boolean indicating whether or not 
 * @param {User} user the user for which we should calculate the hero status
 */
const getUserHeroStatus = function(user) {
  // if a user has a license_id, we'll assume that they're all set
  if (user.license_ids && user.license_ids.length > 0) {
    return Promise.resolve(true)
  } else if (!user.stripe_customer_id) {
    return Promise.resolve(false)
  }

  return stripe.subscriptions.list({
    customer: user.stripe_customer_id, // get subscriptions for this customer
    plan: 'yearly', // only subscriptions to the yearly Hero plan
    status: 'active' // ask for only active subscriptions
  })
  .then((subscriptions) => {
    // data is where the list of subscriptions comes back - our query should leave us with only active yearly Hero subs
    //  so if the length is greater than 1, we should be all good for whether the user is a Hero or not
    if (subscriptions && subscriptions.data && subscriptions.data.length > 0) {
      return true
    } else {
      return false
    }
  })
}

/**
 * Determines whether or not the user needs a refresh
 * @param {Date} lastRefreshTime the time of the user's last refresh
 */
const refreshRequired = function(lastRefreshTime) {
  if (!lastRefreshTime) { console.error('no last_refresh_time on User') }
  return lastRefreshTime > Date.now() - USER_REFRESH_INTERVAL
}

const messageCheckRequired = function(lastMessageCheckTime) {
  return lastMessageCheckTime > (Date.now() - MESSAGE_CHECK_INTERVAL)
}

module.exports = {
  getUserHeroStatus: getUserHeroStatus,
  refreshRequired: refreshRequired,
  messageCheckRequired: messageCheckRequired
}
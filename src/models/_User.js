// library imports
const bcrypt = require('bcryptjs')
const randomstring = require('randomstring')
const ms = require('ms')

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

  let lastCheck = new Date(lastRefreshTime).getTime()
  let nextCheck = lastCheck + USER_REFRESH_INTERVAL

  return nextCheck < Date.now()
}

const messageCheckRequired = function(lastMessageCheckTime) {
  if (!lastMessageCheckTime) { console.error('no last_message_check_time on User') }

  let lastCheck = new Date(lastMessageCheckTime).getTime()
  let nextCheck = lastCheck + MESSAGE_CHECK_INTERVAL
  
  return nextCheck < Date.now()
}

/**
 * Creates and returns a valid 
 * @param {number} validFor time in hours that the token should be valid for 
 * @param {function} callback (tokenObject, tokenString) called with object to be assigned to the User object, and the pre-hash token value to be used as link
 */
const createOneTimeTokenObject = function(validFor, callback) {
  if (!validFor) { validFor = 24 } // time in hours

  let tokenStr = randomstring.generate({
    length: 20,
    charset: 'hex'
  })
  let timeInMs = ms(validFor + 'h')

  let tokenObj = {
    token: bcrypt.hashSync(tokenStr, 5),
    expiration: Date.now() + timeInMs
  }

  return callback(tokenObj, tokenStr)
}

/**
 * Returns whether or not a token is valid
 * @param {string} token the jwt to verify
 */
const validateToken = function(jwt, tokenToCheck) {
  try {
    let tokenSavedToUser = jwt.verify(jwt, process.env.OPTIMUS_TOKEN_SIGNING_SECRET).token
    if (tokenToCheck && tokenToCheck == tokenSavedToUser) {
      return true
    } else {
      return false
    }
  } catch (e) {
    return false
  }
}

module.exports = {
  getUserHeroStatus,
  refreshRequired,
  messageCheckRequired,
  createOneTimeTokenObject,
  validateToken
}
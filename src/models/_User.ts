// library imports
import { hashSync, compareSync } from 'bcryptjs'
import { generate } from 'randomstring'
import ms = require('ms')

// project imports
import * as _stripe from '../services/stripe'
import { OAuthType, OAuthObject } from './User'

// constants
const MESSAGE_CHECK_INTERVAL = 1000 * 60 * 1 // 1 minute
const USER_REFRESH_INTERVAL = 1000 * 60 * 60 * 12 // 12 hrs
const ONE_TIME_TOKEN_SALT = 5

/**
 * Returns a promise resolved with a boolean indicating whether or not
 * @param {User} user the user for which we should calculate the hero status
 */
export const getUserHeroStatus = async function(user) {
  // if a user has a license_id, we'll assume that they're all set
  if (user.license_ids && user.license_ids.length > 0) {
    return true
  } else if (!user.stripe_customer_id) {
    return false
  }

  const subscriptions = await _stripe.getHeroSubscriptions(user.stripe_customer_id, ['active', 'trialing'])
  // data is where the list of subscriptions comes back - our query should leave us with only active yearly Hero subs
  //  so if the length is greater than 1, we should be all good for whether the user is a Hero or not
  if (subscriptions && subscriptions.length > 0) {
    return true
  } else {
    return false
  }
}

/**
 * Determines whether or not the user needs a refresh
 * @param {Date} lastRefreshTime the time of the user's last refresh
 */
export const refreshRequired = function(lastRefreshTime) {
  let lastCheck = new Date(lastRefreshTime).getTime()
  let nextCheck = lastCheck + USER_REFRESH_INTERVAL

  return nextCheck < Date.now()
}

export const messageCheckRequired = function(lastMessageCheckTime) {
  let lastCheck = new Date(lastMessageCheckTime).getTime()
  let nextCheck = lastCheck + MESSAGE_CHECK_INTERVAL

  return nextCheck < Date.now()
}

/**
 * Creates and returns a valid
 * @param {number} validFor time in hours that the token should be valid for
 * @param {function} callback (tokenObject, tokenString) called with object to be assigned to the User object, and the pre-hash token value to be used as link
 */
export const createOneTimeTokenObject = function(validFor) {
  if (!validFor) {
    validFor = 24
  } // time in hours

  let unhashedToken = generate({
    length: 20,
    charset: 'hex',
  })
  let timeInMs = ms(validFor + 'h')
  let tokenObj = {
    token: hashSync(unhashedToken, ONE_TIME_TOKEN_SALT),
    expiration: Date.now() + timeInMs,
  }

  return { unhashedToken, tokenObj }
}

/**
 * Returns whether or not a token is valid
 * @param {Object} tokenObj the token object stored on the user object, with token property and expiration property
 * @param {string} unhashedToken the token given to the user, likely in an email
 */
export const validateToken = function(unhashedToken, tokenObj) {
  // check to see if the current time is past the expiration
  //  past this, the expiration is valid and we just have to compare tokens
  if (!tokenObj.expiration || Date.now() > new Date(tokenObj.expiration).getTime()) {
    return false
  }

  return compareSync(unhashedToken, tokenObj.token)
}

/**
 * Simple function to validate a User property as a valid one time use token storage
 * @param {string} propertyName name of property on User object which the user would like to assign as a one time use token
 */
export const isValidTokenProperty = function(propertyName) {
  // array of all the properties which should be treated as one time use jwt's
  let validProperties = ['reset_email', 'reset_password']
  return validProperties.indexOf(propertyName) > -1
}

export const generateOAuthObject = (id: string | number, type: OAuthType): OAuthObject => {
  return {
    id,
    type,
    singleUseToken: hashSync(id + Date.now().toString(), 4),
    singleUseTokenExpiration: Date.now() + 1000 * 60,
  }
}

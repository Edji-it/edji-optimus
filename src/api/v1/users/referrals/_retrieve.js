// library imports
const randomstring = require('randomstring')

// project imports
const Referral = require('./../../../../models/Referral')

/**
 * Generates and saves a unique referral code, meant to be called recursively
 * @param {number} callCount The number of times this function has been called in an attempt to generate a unique code
 */
const createUniqueReferral = function(callCount) {
  if (callCount >= 5) {
    return Promise.reject('unique code could not be found for createUniqueReferral')
  }
  if (!callCount) { callCount = 0 }

  const possibleCode = randomstring.generate({
    readable: true,
    length: 5,
    capitalization: 'lowercase'
  })
  console.log('calling find')

  return Referral.find({ code: possibleCode }).exec()
  .then((referrals) => {
    console.log('referrals:', referrals)
    if (referrals.length > 0) {
      console.log('re-calling...')
      // this is where we want to re-run the function, because we need to find one with a different function
      return createUniqueReferral(callCount + 1)
    } else {
      let newReferral = Referral({ code: possibleCode })
      return saveReferral(newReferral)
    }
  })
}

/**
 * Basic promisifying saving of referral
 * @param {Referral} referral 
 */
const saveReferral = function(referral) {
  return new Promise((resolve, reject) => {
    console.log('saving...')
    referral.save(false, (err, result) => {
      console.log('saved')
      if (err) { return reject(err) }
      else { return resolve(result) }
    })
  })
}

module.exports = {
  createUniqueReferral: createUniqueReferral
}
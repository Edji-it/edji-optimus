// library imports
const randomstring = require('randomstring')

// project imports
const Referral = require('./../../../../models/Referral')

/**
 * Generates and saves a unique referral code, meant to be called recursively
 * @param {number} callCount The number of times this function has been called in an attempt to generate a unique code
 */
const createUniqueReferral = function (callCount) {
  if (callCount >= 5) {
    return Promise.reject('unique code could not be found for createUniqueReferral')
  }
  if (!callCount) { callCount = 0 }

  const possibleCode = randomstring.generate({
    readable: true,
    length: 5,
    capitalization: 'lowercase'
  })
  console.log('code ' + callCount + ':', possibleCode)

  return Referral.findOne({ code: possibleCode })
    .then((referral) => {
      if (referral) {
        console.log('no referral')
        // this is where we want to re-run the function, because we need to find one with a different function
        return createUniqueReferral(callCount + 1)
      } else {
        console.log('got it!')
        let newReferral = Referral({ code: possibleCode })
        return newReferral.edjiSave(false)
      }
    })
}

module.exports = {
  createUniqueReferral: createUniqueReferral
}
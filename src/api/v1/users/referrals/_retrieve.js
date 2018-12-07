// library imports
const randomstring = require('randomstring')

// project imports
const Referral = require('./../../../../models/Referral')

/**
 * Generates and saves a unique referral code, meant to be called recursively
 * @param {number} callCount The number of times this function has been called in an attempt to generate a unique code
 */
const createUniqueReferral = async function () {
  for (let i = 0; i < 5; i++) {
    const possibleCode = randomstring.generate({
      readable: true,
      length: 5,
      capitalization: 'lowercase'
    })
    let referral = await Referral.findOne({ code: possibleCode })
    if (!referral) {
      let newReferral = await Referral({ code: possibleCode }).edjiSave(false)
      return newReferral
    }
  }
  throw new Error('referral code was not able to be generated after 5 attempts')
}

module.exports = {
  createUniqueReferral: createUniqueReferral
}
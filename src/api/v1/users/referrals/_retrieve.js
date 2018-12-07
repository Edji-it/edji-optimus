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
      console.log('referral', newReferral)
      return newReferral
    }
  }
  throw new Error('referral code was not able to be generated after 5 attempts')

  // const possibleCode = randomstring.generate({
  //   readable: true,
  //   length: 5,
  //   capitalization: 'lowercase'
  // })
  // console.log('code ' + callCount + ':', possibleCode)

  // let referral = await Referral.findOne({ code: possibleCode })
  // if (referral) {
  //   // this is where we want to re-run the function, because we need to find one with a different function
  //   return await createUniqueReferral(callCount + 1)
  // } else {
  //   let newReferral = Referral({ code: possibleCode })
  //   await newReferral.edjiSave(false)
  //   return newReferral
  // }

  // return Referral.findOne({ code: possibleCode })
  //   .then((referral) => {
  //     if (referral) {
  //       console.log('no referral')
  //       // this is where we want to re-run the function, because we need to find one with a different function
  //       return createUniqueReferral(callCount + 1)
  //     } else {
  //       console.log('got it!')
  //       let newReferral = Referral({ code: possibleCode })
  //       return newReferral.edjiSave(false)
  //     }
  //   })
}

module.exports = {
  createUniqueReferral: createUniqueReferral
}
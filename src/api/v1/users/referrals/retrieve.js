// project imports
const helpers = require('./_retrieve')
const Referral = require('./../../../../models/Referral')

module.exports = function (req, res, next) {
  let user = req.user

  console.log('handling...')

  if (!user.referral_code) {
    console.log('no referral code')
    // create a new referral object for the user
    helpers.createUniqueReferral()
      .then((referral) => {
        console.log('i have a referral')
        // update the user with the new referral's code
        user.referral_code = referral.code
        return user.edjiSave(false)
      })
      .then((result) => {
        return res.status(200).send(referral)
      })
      .catch((err) => {
        next(err)
      })
  } else {
    console.log('looking for:', user.referral_code)
    // just go get that user's referral object
    Referral.findOne({ code: user.referral_code })
      .then((referral) => {

        return res.status(200).send(referral)
      })
      .catch((err) => {
        next(err)
      })
  }
}
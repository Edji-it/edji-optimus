// project imports
const helpers = require('./_retrieve')
const Referral = require('./../../../../models/Referral')

module.exports = function (req, res, next) {
  let user = req.user

  if (!user.referral_code) {
    // create a new referral object for the user
    helpers.createUniqueReferral()
      .then((referral) => {
        // update the user with the new referral's code
        user.referral_code = referral.code
        user.edjiSave(false).then((result) => {
          return res.status(200).send(referral)
        })
      })
      .catch((err) => {
        next(err)
      })
  } else {
    // just go get that user's referral object
    Referral.find({ code: user.referral_code }).exec()
      .then((referral) => {
        if (referral.length < 1) {
          return res.status(500).send({ error: 'no referral exists for specified users code' })
        }

        return res.status(200).send(referral[0])
      })
      .catch((err) => {
        next(err)
      })
  }
}
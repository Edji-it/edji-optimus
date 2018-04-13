// project imports
const helpers = require('./_retrieve')
const Referral = require('./../../../../models/Referral')

module.exports = function(req, res) {
  let user = req.user
  
  if (!user.referral_code) {
    helpers.createUniqueReferral()
    .then((referral) => {
      user.referral_code = referral.code
      user.save(false, (err, result) => {
        if (err) {
          console.error(err)
          return res.status(500).send({ error: 'error while saving user with referral_code' })
        }
        
        return res.status(200).send(referral)
      })
    })
    .catch((err) => {
      console.error(err)
      return res.status(500).send({ error: 'could not generate unique code for user' })
    })
  } else {
    Referral.find({ code: user.referral_code }).exec()
    .then((referral) => {
      if (referral.length < 1) {
        return res.status(500).send({ error: 'no referral exists for specified users code' })
      }

      return res.status(200).send(referral[0])
    })
    .catch((err) => {
      console.error(err)
      return res.status(500).send({ error: 'error in finding specified referral' })
    })
  }
}
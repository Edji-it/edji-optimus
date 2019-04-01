// library imports
const _ = require('underscore')

// project imports
const User = require('./../../../models/User')

module.exports = function(req, res, next) {
  let code = req.params.referral_code

  if (!code) {
    return res.status(400).send({ error: 'referral code necessary to retrieve information' })
  }

  // if the user is not auth'd, or their code is not the same as the requested code, there's only limited info we'd like to return to them
  if (!req.user || req.user.referral_code != code) {
    User.findOne({ referral_code: code })
      .exec()
      .then(user => {
        if (!user) {
          return res.status(400).send({ error: 'no user exists for the requested code' })
        }

        let returnUser = _.pick(user, ['fullname'])

        return res.status(200).send({ user: returnUser })
      })
      .catch(err => {
        next(err)
      })
  } else {
    // here the user is auth'd to get the entire referral object, and does not need any user information
    // but we don't want to move the code over here yet because that would be more work
    return res
      .status(400)
      .send({
        error:
          'this route does not yet return a user their referral information - use GET /users/referrals/:referral_code',
      })
  }
}

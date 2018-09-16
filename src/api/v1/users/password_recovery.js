// project imports
const User = require('../../../models/User')
const emailService = require('../../../services/email')
const helpers = require('./_password_recovery')
const bcrypt = require('bcryptjs')

// constants
const PASSWORD_HASH_EXPIRES = /* hours */ 1 * /* seconds */ 3600 * /* ms */ 1000

module.exports = function (req, res) {
  let query = helpers.createQuery(req.body)

  if (!query) {
    return res.status(400).send({ error: 'no username or email sent in request body' })
  }

  // search for either the user's username or their email - let's be flexible here!
  User.findOne(query)
    .then((user) => {
      if (!user) {
        // we don't want them to be able to locate users just with a random username or email
        return res.status(404).send()
      }

      if (helpers.userCanResetPass(user)) {
        const HASH = bcrypt.hashSync(String(user._id) + Date.now().toString(), 8)
        user.resetPasswordToken = HASH
        user.resetPasswordExpires = Date.now() + PASSWORD_HASH_EXPIRES
      }

      // update user with reset variables
      return user.edjiSave(false)
    })
    .then((user) => {
      return helpers.sendRecoveryEmail(user)
    })
    .then(() => {
      return res.status(204).send()
    })
    .catch((err) => {
      console.error(err)
      return res.status(500).send()
    })
}
// library imports
const bcrypt = require('bcryptjs')

// project imports
const User = require('../../../models/User')
const emailService = require('../../../services/email')

// constants
const SUCCESS_STATUS = 204
const PASSWORD_HASH_EXPIRES = /* hours */ 1 * /* seconds */ 3600 * /* ms */ 1000

module.exports = function (req, res) {
  let username = req.body.username
  let email = req.body.email

  let query = {}
  if (username) {
    query.username = username
  } else if (email) {
    query.email = email
  } else {
    return res.status(400).send({ error: 'no username or email sent in request body' })
  }

  // search for either the user's username or their email - let's be flexible here!
  User.findOne(query)
    .then((user) => {
      if (!user) {
        // we don't want them to be able to locate users just with a random username or email
        return res.status(SUCCESS_STATUS).send()
      }

      const HASH = bcrypt.hashSync(String(user._id) + Date.now().toString(), 8)
      user.resetPasswordToken = HASH
      user.resetPasswordExpires = Date.now() + PASSWORD_HASH_EXPIRES

      // update user with reset variables
      return user.edjiSave(false)
    })
    .then((user) => {
      let query = 'token=' + encodeURIComponent(user.resetPasswordToken)

      return emailService.sendEmail({
        email_template: 'recover-password',
        subject: 'Password Recovery - Edji',
        name: user.fullname,
        email: user.email,
        from: 'recovery@edji.it',
        vars_object: {
          name: user.fullname,
          reset_link: `http:${process.env.CLIENT_URL}/#/reset-password?${query}`
        }
      })
    })
    .then(() => {
      return res.status(200).send()
    })
    .catch((err) => {
      console.error(err)
      return res.status(500).send()
    })
}
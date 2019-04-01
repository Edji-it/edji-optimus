// project imports
const User = require('../../../models/User')
const helpers = require('./_password_recovery')
const bcrypt = require('bcryptjs')

// constants
const PASSWORD_HASH_EXPIRES = /* hours */ 1 * /* seconds */ 3600 * /* ms */ 1000

module.exports = function(req, res, next) {
  let query = helpers.createQuery(req.body)

  if (!query) {
    return res.status(400).send({ error: 'no username or email sent in request body' })
  }

  // search for either the user's username or their email - let's be flexible here!
  User.findOne(query)
    .then(user => {
      if (!user) {
        // we don't want them to be able to locate users just with a random username or email
        return res.status(404).send()
      }

      // error cases where the user doesnt have username/password
      if (!helpers.userCanResetPass(user)) {
        if (user.oauth && user.oauth.length > 0) {
          // pull oauth types out of array
          let types = user.oauth.map(({ type }) => {
            return type
          })

          return Promise.resolve({
            status: 400,
            body: {
              error: 'NO_LOGIN_CREDENTIALS',
              message: 'user has no username/password, but has at least one oauth account that could be used to log in',
              oauth_types: types,
            },
          })
        } else {
          let ERROR = 'account has no credentials or oauth: ' + user._id
          console.error(ERROR)
          return Promise.resolve({ status: 500, body: { error: ERROR } })
        }
      }

      const HASH = bcrypt.hashSync(String(user._id) + Date.now().toString(), 8)
      user.resetPasswordToken = HASH
      user.resetPasswordExpires = Date.now() + PASSWORD_HASH_EXPIRES

      // update user with reset variables
      return user
        .edjiSave()
        .then(user => {
          return helpers.sendRecoveryEmail(user) // returns the user object
        })
        .then(() => {
          return Promise.resolve({ status: 204, body: {} })
        })
    })
    .then(({ status, body }) => {
      return res.status(status).send(body) // either 400 or 204
    })
    .catch(err => {
      next(err)
    })
}

// library imports
const Sentry = require('@sentry/node')

module.exports = function (req, res, next) {
  if (req.user) {
    let { _id, type } = req.user
    Sentry.configureScope((scope) => {
      scope.setUser({
        _id,
        type
      })
      next()
    })
  } else {
    next()
  }
}
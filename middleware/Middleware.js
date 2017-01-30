/** Provides middleware for everything except login */

var middleware = {
  
  /** Sends user a 401 if unauthorized to access endpoint */
  authRequired: function(req, res, next) {
    if (!req.user) {
      res.status(401).send()
      next("unauthorized")
    } else {
      next()
    }
  }
}

module.exports = middleware
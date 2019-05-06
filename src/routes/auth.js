// these are oauth routes
const express = require('express')
const router = express.Router()

/**
 * @todo re-ensure these are backwards compatible
 */

// router.get('/google', require('./../api/v1/auth/google').GoogleRedirect)

// router.get(
//   // OAuth 2 callback url. Use this url to configure your OAuth client in the
//   // Google Developers console
//   '/google/callback',
//   require('./../api/v1/auth/google').GoogleCallback,
// )

module.exports = router

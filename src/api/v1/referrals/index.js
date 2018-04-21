// library imports
const router = require('express').Router()

// middleware
const authRequired = require('./../../../middleware/auth-required')

// attach route handlers
// router.get('/', authRequired, require('./list'))

// export
module.exports = router
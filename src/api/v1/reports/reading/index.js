// library imports
const router = require('express').Router()

// middleware
const authRequired = require('./../../../../middleware/auth-required')

// attach route handlers
router.post('/', authRequired, require('./send'))

// export
module.exports = router
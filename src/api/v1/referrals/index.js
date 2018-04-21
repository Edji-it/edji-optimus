// library imports
const router = require('express').Router()

// middleware
// const authRequired = require('./../../../middleware/auth-required')

// attach route handlers
router.get('/:referral_code', require('./retrieve'))

// export
module.exports = router
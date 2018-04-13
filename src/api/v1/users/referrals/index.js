// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../../middleware/auth-required')
const checkId = require('./../check-user-id')

// attach routes
router.get('/:user_id/referrals', authRequired, checkId, require('./retrieve'))

module.exports = router
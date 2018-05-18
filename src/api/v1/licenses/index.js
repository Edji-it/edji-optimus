// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')

router.put('/:license_id/accept', authRequired, require('./update'))
router.put('/:license_id/invite', authRequired, require('./invite'))

module.exports = router
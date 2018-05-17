// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')

router.put('/:license_id', authRequired, require('./update'))

module.exports = router
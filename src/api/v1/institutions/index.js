// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')

router.get('/:institution_id', authRequired, require('./retrieve'))

module.exports = router
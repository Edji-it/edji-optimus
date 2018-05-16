// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')

router.put('/:user_id', authRequired, require('./user-add'))

module.exports = router
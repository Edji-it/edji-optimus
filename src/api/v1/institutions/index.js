// package imports
const router = require('express').Router()

// project imports
// const authRequired = require('./../../../middleware/auth-required')
const localOnly = require('./../../../middleware/local-only')

router.post('/', localOnly, require('./create'))

module.exports = router
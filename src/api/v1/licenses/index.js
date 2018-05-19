// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')
const localOnly = require('./../../../middleware/localOnly')

router.put('/:license_id/accept', authRequired, require('./update'))
router.put('/:license_id/invite', authRequired, require('./invite'))
router.post('/', authRequired, require('./create'))

module.exports = router
// package imports
const router = require('express').Router()

// project imports
const authRequired = require('./../../../middleware/auth-required')
const localOnly = require('./../../../middleware/local-only')

router.put('/:license_id/accept', authRequired, require('./accept'))
router.put('/:license_id/invite', authRequired, require('./invite'))
router.post('/', localOnly, require('./create'))
router.get('/', authRequired, require('./retrieve'))

module.exports = router